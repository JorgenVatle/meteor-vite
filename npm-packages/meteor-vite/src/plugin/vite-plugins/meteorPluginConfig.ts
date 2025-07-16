import { FatalMeteorViteError } from '@/internals/error/MeteorViteError';
import type { PartialPluginConfig } from '@/plugin';
import { mergeMeteorPluginSettings, mergeViteSettings } from '@/plugin/lib/MergeConfig';
import { parseConfig } from '@/plugin/lib/ParseConfig';
import { envOverride } from '@/utilities/server/EnvFlag';
import Path from 'path';
import pc from 'picocolors';
import type { Plugin } from 'vite';
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
        config: (userConfig) => {
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
                    debug: !!process.env.METEOR_VITE_STUBS_DEBUG,
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
            const base = envOverride(
                'METEOR_VITE_BASE_URL',
                pluginSettings.assetsBaseUrl ?? userConfig.base ?? `/${pluginSettings.assetsDir}`
            );
            
            const mergedUserConfig = mergeViteSettings(userConfig, {
                base,
                define: {
                    __VITE_ASSETS_DIR__: JSON.stringify(pluginSettings.assetsDir),
                    __VITE_DYNAMIC_ASSET_BOILERPLATE__: JSON.stringify(pluginSettings.dynamicAssetBoilerplate),
                },
                optimizeDeps: {
                    entries: [pluginSettings.clientEntry],
                },
            });
            
            userConfig.base = mergedUserConfig.base;
            userConfig.define = mergedUserConfig.define;
            userConfig.optimizeDeps = mergedUserConfig.optimizeDeps;
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