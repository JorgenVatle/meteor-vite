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
        name: 'meteor-vite',
        entry: {
            // Stub validation
            'client': './src/client/index.ts',
            
            // Common utility modules (logger, colorization, parsers)
            'utilities': './src/utilities/index.ts',
            
            // The "Meteor-Vite" Vite plugin.
            'plugin': './src/plugin/index.ts',
            
            // Internal tooling for the Meteor build plugin.
            'internal': './src/internals/index.ts',
            
            // Production/Development entry-modules for the Meteor-server runtime
            'server-entrypoint': './src/server-entrypoint',
        },
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
]);