import FS from 'fs';
import Path from 'path';
import {
    type BuildEnvironmentOptions,
    createRunnableDevEnvironment,
    type InlineConfig,
    resolveConfig,
} from 'vite';
import { MeteorViteError } from '../../../error/MeteorViteError';
import { meteorWorker } from '../../plugin/Meteor';
import { type ProjectJson, type ResolvedMeteorViteConfig } from '../../plugin/Settings';
import Instance from './Instance';
import { clientMainModule, serverMainModule } from '../scripts/Setup';

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
    
    const needsReactPreamble = Object.keys(packageJson?.devDependencies).includes('@vitejs/plugin-react') || Object.keys(packageJson.dependencies).includes('@vitejs/plugin-react');
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
        base: '/vite',
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
    
    return {
        config,
        packageJson,
        outDir,
        needsReactPreamble,
        viteServerMainModule
    }
}

function parsePackageJson(): ProjectJson {
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