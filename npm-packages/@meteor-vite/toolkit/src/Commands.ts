import { Changes } from '@/Changes';
import { CommandList } from '@/lib/CommandList';
import * as process from 'node:process';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';

export const Commands = new CommandList([
    {
        name: 'build-if-changed',
        description: 'Run the build script if the current root directory has seen changes since last build.',
        handler: async ({ rootDir }) => {
            const changes = new Changes(rootDir);
            await changes.buildIfChanged();
        }
    },
    {
        name: 'check-changes',
        description: 'Check if the current root directory has seen changes since last build.',
        handler: async ({ rootDir }) => {
            const changes = new Changes(rootDir, {
                detailedLogging: true,
                saveBuildHash: false,
            });
            await changes.checkChanges();
        }
    },
    {
        name: 'build',
        description: 'Run a build and compute the build hash for the provided project root directory.',
        handler: async ({ rootDir }) => {
            const changes = new Changes(rootDir, {
                saveBuildHash: true,
            });
            process.chdir(rootDir);
            if (envFlag('FORCE_BUILD') || await changes.hasChanged()) {
                
                await changes.checkChanges();
            } else {
                console.log('No changes detected, skipping build');
            }
        }
    }
]);
