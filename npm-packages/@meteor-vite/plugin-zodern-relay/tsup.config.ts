import { defineBuildConfig } from '@meteor-vite/toolkit';

export default defineBuildConfig(import.meta.dirname, {
    name: '@meteor-vite/plugin-zodern-relay',
    entry: ['src/Plugin.ts'],
})