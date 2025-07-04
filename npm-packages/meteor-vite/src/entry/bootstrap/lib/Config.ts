import FS from 'fs';
import Path from 'path';
import { createRunnableDevEnvironment, type InlineConfig, resolveConfig } from 'vite';
import { MeteorViteError } from '../../../error/MeteorViteError';
import { Colorize } from '../../../utilities';
import Logger from '../../../utilities/Logger';
import { meteorWorker } from '../../plugin/Meteor';
import { type ProjectJson, type ResolvedMeteorViteConfig } from '../../plugin/Settings';
import { clientMainModule, serverMainModule } from '../scripts/Setup';
import Instance from './Instance';

export const CurrentConfig = globalThis.MeteorViteRuntimeConfig;

export async function resolveMeteorViteConfig(
    inlineConfig: InlineConfig,
    command: 'build' | 'serve',
) {
    Instance.printWelcomeMessage();
    Instance.logger.info('Resolving Vite config...');
    
    const { projectRoot, outDir } = CurrentConfig;
    const packageJson = parsePackageJson();
    process.chdir(projectRoot);
    
    if (FS.existsSync(Path.join(projectRoot, '.meteorignore'))) {
        Logger.warnOnce({ id: '.meteorignore' }, [
            `Detected ${Colorize.fileType('.meteorignore')} file.`,
            `Make sure that the paths within won't match any files within ${Colorize.filepath('./_vite-bundle')} as this`,
            `could lead to certain assets not being available in production.`,
            '',
            `Anything outside of this directory you're free to ignore, you can even ignore source`,
            `files as long as they are imported by your Vite entry module.\n\n`,
        ].join('\n   '));
    }
    
    const nonEsmConfigFile = FS.existsSync(Path.join(projectRoot, 'vite.config.ts')) || FS.existsSync(Path.join(projectRoot, 'vite.config.js'));
    
    if (packageJson.type !== 'module' && nonEsmConfigFile) {
        Logger.warnOnce({ id: '.viteignore' }, [
            `Vite config without .mjs or .mts extension detected.`,
            'This will likely prevent Meteor from starting when trying to resolve your config.',
            'Renaming vite.config.ts to vite.config.mts should resolve the issue this in most cases',
            '',
            'Setting "type": "module" in your package.json should fix this, but Meteor lacks good support for this',
            'at the time of writing. The best workaround for using package.json "module" types is to symlink your',
            '.meteor/local directory outside of your project root (e.g. ln -s /tmp/.meteor-local/my-app .meteor/local)\n\n',
        ].join('\n   '))
    }
    
    /**
     * Only available within the context of the compiler plugin.
     * At runtime, Meteor-Tool's initial arguments aren't made available
     */
    const isSimulatedProduction = process.argv.includes('--production');
    const needsReactPreamble = Object.keys(packageJson?.devDependencies || {}).includes('@vitejs/plugin-react') || Object.keys(packageJson.dependencies || {}).includes('@vitejs/plugin-react');
    let viteServerMainModule: undefined | string = undefined;
    
    const userConfig: ResolvedMeteorViteConfig = await resolveConfig(Object.assign({
        configFile: packageJson.meteor.vite?.configFile,
    }, inlineConfig), command);
    
    if (!userConfig.meteor?.clientEntry) {
        throw new MeteorViteError('Cannot build application. You need to specify a clientEntry in your Vite config!');
    }
    
    function fileNameTemplates(env: 'server' | 'client') {
        const template = {
            assetFileNames: `assets/[name]-[hash][extname]`,
            chunkFileNames: `chunk/[name]-[hash].js`,
            entryFileNames: `entry-${env}/[name]-[hash].entry.js`,
        }
        
        if (env === 'server') {
            template.assetFileNames.replace('[name]', 'server/[name]');
            template.chunkFileNames.replace('[name]', 'server/[name]');
            template.entryFileNames.replace('entry-server', 'entry/server');
        }
        
        return template;
    }
    
    if (userConfig.meteor.serverEntry) {
        if (userConfig.meteor.enableExperimentalFeatures) {
            viteServerMainModule = userConfig.meteor.serverEntry;
        } else {
            Instance.logger.warn(
                'To enable server bundling, you need to set "enableExperimentalFeatures" to true in your Vite' +
                ' config. To disable these warnings, just remove the "serverEntry" field in your Vite config.'
            );
        }
    }
    
    if (!userConfig.meteor._configSource) {
        Instance.logger.warn('Make sure you configure Meteor-Vite using the Vite plugin, not the old top-level `meteor` config property.')
        Instance.logger.warn('See the readme for an example: https://github.com/JorgenVatle/meteor-vite?tab=readme-ov-file#vite-config')
    }
    
    const config = {
        ...inlineConfig,
        meteor: userConfig.meteor,
        base: userConfig.base,
        appType: 'custom',
        server: { middlewareMode: true, },
        configFile: userConfig.configFile,
        plugins: [
            meteorWorker({
                meteorStubs: { packageJson }
            })
        ],
        build: {
            outDir,
            emptyOutDir: false,
            ssrManifest: `ssr.manifest.json`,
            manifest: `client.manifest.json`,
            rollupOptions: {
                output: fileNameTemplates('client'),
            }
        },
        environments: {
            server: {
                dev: {
                    createEnvironment(name, config) {
                        return createRunnableDevEnvironment(name, config);
                    }
                },
                resolve: {
                    external: true,
                    noExternal: ['meteor-vite']
                },
                build: {
                    target: 'node21',
                    manifest: false,
                    ssrManifest: false,
                    minify: false,
                    sourcemap: true,
                    rollupOptions: {
                        external: [/^meteor\//],
                        input: {
                            main: serverMainModule({
                                meteorMainModule: packageJson.meteor.mainModule.server,
                                viteMainModule: viteServerMainModule,
                            }),
                        },
                        output: {
                            // Unfortunately Meteor still doesn't support
                            // ESM within the final server bundle.
                            format: 'module',
                            ...fileNameTemplates('server'),
                        }
                    },
                },
            },
            client: {
                build: {
                    rollupOptions: {
                        input: {
                            main: clientMainModule({
                                viteMainModule: userConfig.meteor.clientEntry,
                                modulePreload: inlineConfig.build?.modulePreload
                            }),
                        },
                    }
                }
            }
        },
    } satisfies InlineConfig & Pick<ResolvedMeteorViteConfig, 'meteor'>;
    
    const modules = {
        clientEntry: Path.relative(projectRoot,
            CurrentConfig.clientEntryModule || config.meteor.clientEntry /* <- Addresses older versions of jorgenvatle:vite */
        ),
        serverEntry: config.meteor?.serverEntry && Path.resolve(config.meteor.serverEntry),
    }
    
    return {
        config,
        packageJson,
        outDir,
        assetsDir: userConfig.meteor.assetsDir,
        needsReactPreamble,
        viteServerMainModule,
        modules,
        isSimulatedProduction,
    }
}

export function parsePackageJson(): ProjectJson {
    const { projectRoot } = CurrentConfig;
    const path = Path.join(projectRoot, 'package.json');
    
    if (!FS.existsSync(path)) {
        throw new Error(`⚡ Could not resolve package.json for your project: ${projectRoot}`);
    }
    
    return Object.assign({
        dependencies: {},
        devDependencies: {}
    }, JSON.parse(FS.readFileSync(path, 'utf8')));
}