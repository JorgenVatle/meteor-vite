import type { ResolvedPluginSettings } from '@/types/MeteorVitePluginConfig';

declare module 'vite' {
    interface ResolvedEnvironmentOptions {
        meteor?: ResolvedPluginSettings
    }
}

export {}