import type { ResolvedPluginSettings } from '@/types/MeteorVitePluginSettings';

declare module 'vite' {
    interface ResolvedEnvironmentOptions {
        meteor?: ResolvedPluginSettings
    }
}

export {}