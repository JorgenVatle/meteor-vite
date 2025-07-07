import type { MeteorVitePluginConfig, PartialPluginConfig } from '@/plugin';
import { mergeWithTypes, parseConfig } from '@/plugin/lib/ParseConfig';
import type { ResolvedConfig, UserConfig } from 'vite';

export function mergeMeteorPluginSettings(
    userConfig: ResolvedConfig | UserConfig,
    defaults: PartialPluginConfig,
    overrides: PartialPluginConfig
) {
    const viteConfig = parseConfig(userConfig);
    const existingSettings = viteConfig.meteor || {};
    const withDefaults = mergeWithTypes(defaults, existingSettings);
    return viteConfig.meteor = mergeWithTypes(withDefaults, overrides) as MeteorVitePluginConfig;
}

export function mergeViteSettings(
    userConfig: ResolvedConfig | UserConfig,
    defaults: UserConfig,
) {
    const viteConfig = parseConfig(userConfig);
    return mergeWithTypes(defaults, viteConfig);
}
