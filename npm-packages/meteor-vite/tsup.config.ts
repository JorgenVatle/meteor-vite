import { defineBuildConfig } from '@meteor-vite/toolkit';
import FS from 'fs';
import Path from 'path';

export default defineBuildConfig(__dirname, [
    // Internal entry points
    {
        name: 'meteor-vite/esm',
        entry: {
            // The "Meteor-Vite" Vite plugin.
            'plugin': './src/plugin/index.ts',
            
            // Internal tooling for the Meteor build plugin.
            'internals': './src/internals/main.ts',
        },
        format: ['esm'],
        platform: 'node',
        onSuccess: async () => {
            forceMeteorWatcherReload(['build-plugin.mjs']);
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

/**
 * Force any running Meteor server to do a full restart when Meteor-Vite changes.
 */
function forceMeteorWatcherReload(files: string[]) {
    const atmospherePackageOutDir = Path.join(__dirname, '..', '..', 'packages', 'vite', 'dist');
    const commentPrefix = '// Forcing file watcher reload';
    
    if (!FS.existsSync(atmospherePackageOutDir)) {
        console.warn('\n\n', 'Missing output directory for Meteor build plugin package. Skipping forced reload.', '\n\n');
        return;
    }
    
    for (const file of files) {
        const path = Path.join(atmospherePackageOutDir, file);
        
        if (!FS.existsSync(path)) {
            throw new Error(`Unable to run forced Meteor watcher reload. Build output file does not exist: ${path}`)
        }
        
        const content = FS.readFileSync(path, 'utf-8');
        const lines = content.split(/[\r\n]/).filter((line) => {
            return !line.includes(commentPrefix);
        });
        
        lines.push(`${commentPrefix} - ${new Date()}`);
        
        FS.writeFileSync(
            Path.join(atmospherePackageOutDir, file),
            lines.join('\n')
        );
    }
}