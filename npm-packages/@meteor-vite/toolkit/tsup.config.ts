import { defineBuildConfig } from '@/defineBuildConfig';
import FS from 'fs/promises';

export default defineBuildConfig(import.meta.dirname, [
    {
        name: '@meteor-vite/toolkit: package',
        entry: ['src/index.ts'],
    },
    {
        name: '@meteor-vite/toolkit: bin',
        entry: ['src/bin'],
        outDir: 'dist/bin',
        async onSuccess() {
            await FS.cp('./dist/bin/', './bin/', {
                recursive: true,
            });
            console.log('Copied ./dist/bin files to ./bin/');
        },
        format: ['esm'],
        dts: false,
        banner: {
            js: '#!/usr/bin/env node',
        },
    }
]);