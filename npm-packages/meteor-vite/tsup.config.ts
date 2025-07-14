import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: [
            './src/bin/worker.ts',
            './src/client/index.ts',
        ],
        outDir: 'dist',
        format: 'esm',
        sourcemap: true,
        dts: false,
    },
    {
        entry: [
            './src/plugin/index.ts',
        ],
        outDir: 'dist/plugin',
        format: [
            'cjs',
            'esm',
        ],
        sourcemap: true,
        dts: true,
    },
]);