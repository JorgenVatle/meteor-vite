import FS from 'fs';
import Path from 'path';
import { defineConfig } from 'tsup';
import { EsbuildPluginMeteorStubs } from '../../tsup.config';

const STRIP_ANSI_DEPS = [
    'wrap-ansi',
    'strip-ansi',
    'ansi-regex',
    'emoji-regex',
    'string-width',
    'get-east-asian-width',
    'eastasianwidth',
]

export default defineConfig([
    // Internal entry points
    {
        name: 'meteor-vite/internals',
        entry: [
            './src/entry/bootstrap/index.ts',
            './src/entry/bootstrap/hmr.ts',
            './src/entry/bootstrap/scripts/index.ts',
            './src/entry/bootstrap/production.ts',
            './src/entry/bootstrap/CommonEnvironment.ts',
            './src/entry/bootstrap/boilerplate/index.ts',
        ],
        format: 'esm',
        sourcemap: true,
        target: 'node22',
        outDir: './dist/bootstrap',
        skipNodeModulesBundle: true,
        dts: true,
        onSuccess: async () => {
            try {
                const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'dist');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.mjs'), '\n // Forcing reload');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.js'), '\n // Forcing reload');
            } catch (error) {
                console.warn(error);
            }
        },
        noExternal: ['meteor', 'picocolors', ...STRIP_ANSI_DEPS],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    },
    
    // Stub validation
    {
        name: 'meteor-vite/client',
        entry: {
            client: './src/entry/client/index.ts',
        },
        format: 'esm',
        sourcemap: true,
        dts: true,
        skipNodeModulesBundle: true,
    },
    
    // Plugin entry
    {
        name: 'meteor-vite/plugin',
        entry: {
            plugin: './src/entry/plugin/index.ts',
        },
        format: ['cjs', 'esm'],
        sourcemap: true,
        dts: true,
        skipNodeModulesBundle: true,
    },
    
    // Utilities
    {
        name: 'meteor-vite/utilities',
        entry: {
            utilities: './src/utilities/index.ts',
        },
        format: ['cjs', 'esm'],
        sourcemap: true,
        keepNames: false,
        dts: true,
        skipNodeModulesBundle: true,
    },
]);