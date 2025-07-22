import { FatalMeteorViteError } from '@/internals/error/MeteorViteError';
import { resolveMainModules } from '@/internals/lib/EntryModule/helpers/resolve';
import { parsePackageJson } from '@/internals/lib/parsePackageJson';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import type { PartialPluginConfig } from '@/plugin';
import { mergeMeteorPluginSettings } from '@/plugin/lib/MergeConfig';
import { parseConfig } from '@/plugin/lib/ParseConfig';
import { ViteEnvironmentName } from '@/utilities/common';
import { trimLeadingSlash } from '@/utilities/server';
import { debugEnabled, envOverride } from '@/utilities/server/EnvFlag';
import Path from 'path';
import pc from 'picocolors';
import { createRunnableDevEnvironment, type Plugin, type UserConfig } from 'vite';
import PackageJSON from '../../../package.json';

/**
 * Internal worker plugin. Merges the user's config with necessary overrides for the Meteor compiler and loads the
 * MeteorStubs plugin.
 */
export function meteorPluginConfig(config: PartialPluginConfig): Plugin {
    const METEOR_LOCAL_DIR = process.env.METEOR_LOCAL_DIR || Path.join('.meteor', 'local');
    let enforce: 'pre' | undefined;
    let resolveId: Plugin['resolveId'];
    
    if (config.externalizeNpmPackages) {
        enforce = 'pre';
        resolveId = function resolveId(id) {
            const [module, ...path] = id.split('/');
            const match = config.externalizeNpmPackages?.find((name) => {
                if (!name) return false;
                if (module !== name) return false;
                return true;
            });
            if (!match) {
                return;
            }
            return `\0meteor:${id}`;
        };
    }
    
    return {
        name: 'meteor-vite:config',
        enforce,
        resolveId,
        config: (userConfig, { command }): UserConfig => {
            const pluginSettings = mergeMeteorPluginSettings(userConfig, {
                _configSource: 'plugin',
                meteorStubs: {
                    packageJsonPath: 'package.json',
                    meteor: {
                        /**
                         * Client package cache
                         * @deprecated Use {@link buildProgramsPath} instead
                         */
                        packagePath: Path.join(METEOR_LOCAL_DIR, 'build', 'programs', 'web.browser', 'packages'),
                        
                        buildProgramsPath: Path.join(METEOR_LOCAL_DIR, 'build', 'programs'),
                        isopackPath: Path.join(METEOR_LOCAL_DIR, 'isopacks'),
                    },
                    debug: debugEnabled('meteor-vite', 'stubs'),
                },
                tempDir: Path.join(METEOR_LOCAL_DIR, 'vite'),
                assetsDir: 'vite',
                dynamicAssetBoilerplate: false,
                stubValidation: {
                    warnOnly: process.env.NODE_ENV === 'production',
                    disabled: false,
                    ignorePackages: [
                        // These packages have exports that are intentionally left as undefined
                        // Causing false-positive validation warnings.
                        // https://github.com/JorgenVatle/meteor-vite/issues/246
                        'roles',
                        'alanning:roles',
                        'meteor/mongo',
                    ],
                },
            }, config);
            
            pluginSettings.assetsDir = envOverride(
                'METEOR_VITE_ASSETS_DIR',
                pluginSettings.assetsDir
            );
            
            const packageJson = pluginSettings.meteorStubs.packageJson || parsePackageJson();
            const mainModule = resolveMainModules({
                packageJson,
                // @ts-expect-error Mismatch between hook's config type and expected input type
                userConfig
            });
            
            return {
                appType: 'custom',
                server: {
                    middlewareMode: true,
                },
                base: envOverride(
                    'METEOR_VITE_BASE_URL',
                    pluginSettings.assetsBaseUrl ?? userConfig.base ?? `/${trimLeadingSlash(pluginSettings.assetsDir)}`
                ),
                build: {
                    outDir: CurrentConfig.outDir,
                    emptyOutDir: false,
                    ssrManifest: `ssr.manifest.json`,
                    manifest: `client.manifest.json`,
                    rollupOptions: {
                        output: fileNameTemplates('client'),
                    }
                },
                define: {
                    __VITE_ASSETS_DIR__: JSON.stringify(pluginSettings.assetsDir),
                    __VITE_DYNAMIC_ASSET_BOILERPLATE__: JSON.stringify(pluginSettings.dynamicAssetBoilerplate),
                },
                optimizeDeps: {
                    entries: [pluginSettings.clientEntry],
                },
                environments: {
                    [ViteEnvironmentName.server]: {
                        dev: {
                            createEnvironment(name, config) {
                                return createRunnableDevEnvironment(name, config);
                            }
                        },
                        resolve: {
                            external: true,
                            noExternal: command === 'build' ? METEOR_VITE_RUNTIME_DEPENDENCIES : [],
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
                                    main: mainModule.vite.server.path,
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
                    [ViteEnvironmentName.client]: {
                        build: {
                            rollupOptions: {
                                input: {
                                    main: mainModule.vite.client.path,
                                },
                            }
                        }
                    }
                }
            }
        },
        configResolved(resolvedConfig) {
            const config = parseConfig(resolvedConfig);
            if (!config.meteor) {
                throw new FatalMeteorViteError(
                    `Could not retrieve Meteor-Vite settings! Did you forget to add ${pc.yellow('meteor-vite')} to your Vite config?`,
                    {
                        subtitle: `See the following link for a setup guide ${PackageJSON.homepage}`,
                    },
                );
            }
            
            if (!config.meteor.clientEntry) {
                throw new FatalMeteorViteError(`You need to specify an entrypoint for Vite!`, {
                    subtitle: `More info available here ${PackageJSON.homepage}`,
                });
            }
        },
    };
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

const WRAP_ANSI_DEPS = [
    'wrap-ansi',
    'strip-ansi',
    'ansi-regex',
    'emoji-regex',
    'string-width',
    'get-east-asian-width',
    'eastasianwidth',
]
const METEOR_VITE_RUNTIME_DEPENDENCIES = [
    'picocolors',
    'meteor-vite',
    ...WRAP_ANSI_DEPS,
]
