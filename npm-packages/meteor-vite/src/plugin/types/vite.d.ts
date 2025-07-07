import type { MeteorVitePluginConfig } from './MeteorVitePluginConfig';

declare module 'vite' {
    interface ResolvedEnvironmentOptions {
        meteor?: MeteorVitePluginConfig
    }
}

export {}