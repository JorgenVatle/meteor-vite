import type { MeteorVitePluginSettings } from '@/types/MeteorVitePluginSettings';
import { mergeConfig, ResolvedConfig, UserConfig } from 'vite';

export function mergeWithTypes<
    TDefaults extends Record<string, any>,
    TOverrides extends Record<string, any>,
>(defaults: TDefaults, overrides: TOverrides) {
    return mergeConfig(defaults as any, overrides as any) as TDefaults & TOverrides;
}

export function parseConfig<TConfig extends ResolvedConfig | UserConfig>(config: TConfig): TConfig & {
    meteor?: MeteorVitePluginSettings
} {
    return config;
}

