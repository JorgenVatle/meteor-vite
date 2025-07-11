import { defineBuildConfig } from '@meteor-vite/toolkit';

export default defineBuildConfig(import.meta.dirname, {
    entry: ['src/Plugin.ts'],
})