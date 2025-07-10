import { defineBuildConfig } from '@/defineBuildConfig';

export default defineBuildConfig(import.meta.dirname, [
    {
        name: '@meteor-vite/toolkit',
        entry: ['src/index.ts'],
    },
    {
        name: '@meteor-vite/toolkit: bin',
        entry: ['src/bin'],
        format: ['esm'],
        dts: false,
        clean: true,
        banner: {
            js: '#!/usr/bin/env node',
        },
    }
]);