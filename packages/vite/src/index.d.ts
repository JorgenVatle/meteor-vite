import type { CurrentConfig } from './util/CurrentConfig';

declare global {
    interface MeteorViteRuntimeConfig {
    
    }
    
    namespace globalThis {
        var MeteorViteRuntimeConfig: (typeof CurrentConfig) & MeteorViteRuntimeConfig;
        var __VITE_ASSETS_DIR__: string;
        var __VITE_DYNAMIC_ASSET_BOILERPLATE__: boolean;
    }
}
