import { defineBuildConfig } from '@meteor-vite/toolkit';
import FS from 'fs';
import Path from 'path';

let clean = false;

try {
    clean = JSON.parse(process.env.TSUP_CLEAN || 'true')
} catch (error) {
    console.warn(error);
}

export default defineBuildConfig(__dirname, [
    // Internal entry points
    {
        name: 'meteor-vite/esm',
        entry: {
            // The "Meteor-Vite" Vite plugin.
            'plugin': './src/plugin/index.ts',
            
            // Internal tooling for the Meteor build plugin.
            'internals': './src/internals/index.ts',
        },
        format: ['esm'],
        platform: 'node',
        clean,
        onSuccess: async () => {
            try {
                const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'dist');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.mjs'), '\n // Forcing reload');
                FS.appendFileSync(Path.join(atmospherePackageOutDir, 'server.js'), '\n // Forcing reload');
            } catch (error) {
                console.warn(error);
            }
        },
    },
    // Server runtime entry-points
    {
        name: 'meteor-vite/server-entry',
        entry: ['./src/server-entry/*.ts'],
        outDir: './dist/server-entry',
        format: ['esm'],
        platform: 'node',
    },
    // Browser modules
    {
        name: 'meteor-vite/client',
        entry: {
            // Stub validation module
            'client': './src/client/index.ts',
            // Common utility modules; constants, package info, etc.
            'utilities/common': './src/utilities/common/index.ts',
        },
        format: ['esm', 'cjs'],
        platform: 'browser',
    },
]);
