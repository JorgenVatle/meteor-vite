import { MeteorViteError } from '@/internals/error';
import { parsePackageJson } from '@/internals/lib/parsePackageJson';
import { clientMainModule, serverMainModule } from '@/internals/scripts/Setup';

import type { ResolvedViteConfig } from '@/plugin';
import { meteorWorker } from '@/plugin/Meteor';
import Path from 'path';
import { createRunnableDevEnvironment, type InlineConfig, resolveConfig } from 'vite';
import Instance from '../MeteorViteRuntime';

export const CurrentConfig = globalThis.MeteorViteRuntimeConfig;

export async function resolveMeteorViteConfig(
    inlineConfig: Omit<InlineConfig, 'future'>,
    command: 'build' | 'serve',
) {
    Instance.printWelcomeMessage();
    Instance.logger.info('Resolving Vite config...');
    
    const { projectRoot, outDir } = CurrentConfig;
    const packageJson = parsePackageJson();
    process.chdir(projectRoot);
    
    /**
     * Check for and warn users of potential project misconfigurations
     */
    Instance.emitWarningMessages(packageJson)
    
    /**
     * Only available within the context of the compiler plugin.
     * At runtime, Meteor-Tool's initial arguments aren't made available
     */
    const isSimulatedProduction = process.argv.includes('--production');
    const needsReactPreamble = Object.keys(packageJson?.devDependencies || {}).includes('@vitejs/plugin-react') || Object.keys(packageJson.dependencies || {}).includes('@vitejs/plugin-react');
    let viteServerMainModule: undefined | string = undefined;
    
    const userConfig: ResolvedViteConfig = await resolveConfig(Object.assign({
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
    } satisfies InlineConfig & Pick<ResolvedViteConfig, 'meteor'>;
    
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

