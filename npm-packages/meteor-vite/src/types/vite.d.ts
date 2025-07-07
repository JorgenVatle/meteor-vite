import type { ResolvedPluginSettings } from '@/types/PluginSettings';

declare module 'vite' {
    interface ResolvedEnvironmentOptions {
        meteor?: ResolvedPluginSettings
    }
}

export {}