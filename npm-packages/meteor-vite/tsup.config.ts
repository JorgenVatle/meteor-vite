import FS from 'fs';
import Path from 'path';
import { defineConfig } from 'tsup';
import { EsbuildPluginMeteorStubs } from '../../tsup.config';

export default defineConfig([
    // Internal entry points
    {
        name: 'meteor-vite/internals',
        entry: [
            './src/entry/client/index.ts',
            './src/entry/bootstrap/index.ts',
            './src/entry/bootstrap/RuntimeHMR.ts',
            './src/entry/bootstrap/scripts/index.ts',
            './src/entry/bootstrap/ProductionEnvironment.ts',
            './src/entry/bootstrap/CommonEnvironment.ts',
        ],
        outDir: 'dist',
        format: 'esm',
        sourcemap: true,
        target: 'node20',
        keepNames: false,
        dts: false,
        onSuccess: async () => {
            try {
                const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'dist');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.mjs'), '\n // Forcing reload');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.js'), '\n // Forcing reload');
            } catch (error) {
                console.warn(error);
            }
        },
        noExternal: ['meteor'],
        external: ['vitest'],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    },
    
    // Plugin entry
    {
        name: 'meteor-vite/internals',
        entry: [
            './src/entry/plugin/index.ts',
        ],
        outDir: 'dist/plugin',
        format: [
            'cjs',
            'esm',
        ],
        sourcemap: true,
        keepNames: false,
        dts: true,
    },
]);