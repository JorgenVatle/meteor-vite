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
    'ansi-styles',
    'get-east-asian-width',
    'eastasianwidth',
]

export default defineConfig([
    // Internal entry points
    {
        name: 'meteor-vite/esm',
        entry: {
            // The "Meteor-Vite" Vite plugin.
            'plugin': './src/plugin/index.ts',
            
            // Internal tooling for the Meteor build plugin.
            'internals': './src/internals/index.ts',
            
            // Server utility modules (logger, colorization, parsers)
            'utilities/server': './src/utilities/server/index.ts',
            
            // Meteor Production/Development environment bootstrapper
            // - Starts the vite dev server in development and loads server-side HMR hooks (if server builds are enabled)
            // - Serves static files from the Vite bundle in production
            'server-entry/development': './src/server-entry/development.ts',
            'server-entry/production': './src/server-entry/production.ts',
            
            // Initializes HMR hooks for the Meteor-server. (Cleanup of side-effects from e.g. Meteor.publish(...))
            'server-entry/hmr': './src/server-entry/hmr.ts',
        },
        format: ['esm'],
        sourcemap: true,
        clean: JSON.parse(process.env.TSUP_CLEAN || 'true'),
        target: 'node22',
        outDir: 'dist',
        // skipNodeModulesBundle: true,
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
        name: 'meteor-vite/client',
        entry: {
            // Stub validation module
            'client': './src/client/index.ts',
            // Common utility modules; constants, package info, etc.
            'utilities/common': './src/utilities/common/index.ts',
        },
        format: ['esm', 'cjs'],
        sourcemap: true,
        platform: 'browser',
        dts: true,
        noExternal: ['meteor', 'picocolors', ...STRIP_ANSI_DEPS],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    },
]);