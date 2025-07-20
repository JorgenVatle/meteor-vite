import { defineBuildConfig } from '@/index';

export default defineBuildConfig(import.meta.dirname, [
    {
        name: '@meteor-vite/toolkit: package',
        entry: ['src/index.ts'],
        format: ['cjs', 'esm'],
    },
    {
        name: '@meteor-vite/toolkit: bin',
        entry: ['src/bin'],
        outDir: 'dist/bin',
        format: ['esm'],
        dts: false,
        banner: {
            js: '#!/usr/bin/env -S node --enable-source-maps',
        },
    }
]);