import { defineBuildConfig } from '@/defineBuildConfig';

export default defineBuildConfig(import.meta.dirname, [
    {
        name: '@meteor-vite/toolkit: package',
        entry: ['src/index.ts'],
    },
    {
        name: '@meteor-vite/toolkit: bin',
        entry: ['src/bin'],
        outDir: 'bin',
        format: ['esm'],
        dts: false,
        banner: {
            js: '#!/usr/bin/env node',
        },
    }
]);