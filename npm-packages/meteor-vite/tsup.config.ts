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
        },
        format: ['esm', 'cjs'],
        sourcemap: true,
        target: 'node22',
        outDir: './dist',
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
    {
        name: 'meteor-vite/server-entrypoint',
        entry: {
            // Meteor Production/Development environment bootstrapper
            // - Starts the vite dev server in development and loads server-side HMR hooks (if server builds are enabled)
            // - Serves static files from the Vite bundle in production
            'development': './src/server-entrypoint/development.ts',
            'production': './src/server-entrypoint/production.ts',
            
            // Initializes HMR hooks for the Meteor-server. (Cleanup of side-effects from e.g. Meteor.publish(...))
            'hmr': './src/server-entrypoint/hmr.ts',
        },
        format: ['esm'],
        sourcemap: true,
        target: 'node22',
        outDir: './dist/server-entrypoint',
        noExternal: ['meteor', 'picocolors', ...STRIP_ANSI_DEPS],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    }
]);