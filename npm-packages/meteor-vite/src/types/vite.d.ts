import type { MeteorVitePluginConfig } from '@/types/MeteorVitePluginConfig';

declare module 'vite' {
    interface ResolvedEnvironmentOptions {
        meteor?: MeteorVitePluginConfig
    }
}

export {}