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
        copy: [
            { from: 'dist/bin', to: 'bin', type: 'directory' }
        ],
        format: ['esm'],
        dts: false,
        banner: {
            js: '#!/usr/bin/env node',
        },
    }
]);