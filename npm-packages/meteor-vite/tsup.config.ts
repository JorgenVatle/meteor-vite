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

const COMMON_ENTRIES = {
    // Stub validation
    'client': './src/client/index.ts',
    
    // Common utility modules (logger, colorization, parsers)
    'utilities': './src/utilities/index.ts',
    
    // The "Meteor-Vite" Vite plugin.
    'plugin': './src/plugin/index.ts',
}

export default defineConfig([
    // Internal entry points
    {
        name: 'meteor-vite/esm',
        entry: {
            ...COMMON_ENTRIES,
            
            // Internal tooling for the Meteor build plugin.
            'internals': './src/internals/index.ts',
            
            // Meteor Production/Development environment bootstrapper
            // - Starts the vite dev server in development and loads server-side HMR hooks (if server builds are enabled)
            // - Serves static files from the Vite bundle in production
            'server-entrypoint/development': './src/server-entrypoint/development.ts',
            'server-entrypoint/production': './src/server-entrypoint/production.ts',
            
            // Initializes HMR hooks for the Meteor-server. (Cleanup of side-effects from e.g. Meteor.publish(...))
            'server-entrypoint/hmr': './src/server-entrypoint/hmr.ts',
        },
        outExtension(file) {
            return {
                dts: '.d.ts',
            }
        },
        format: ['esm'],
        sourcemap: true,
        target: 'node22',
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
        name: 'meteor-vite/cjs',
        entry: COMMON_ENTRIES,
        format: ['cjs'],
        sourcemap: true,
        target: 'node22',
        noExternal: ['meteor', 'picocolors', ...STRIP_ANSI_DEPS],
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
        ]
    }
]);