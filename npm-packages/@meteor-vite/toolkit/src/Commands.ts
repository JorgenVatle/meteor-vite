import { CommandList } from '@/lib/CommandList';
import { ProjectCompiler } from '@/ProjectCompiler';

export const Commands = new CommandList([
    {
        name: 'check-changes',
        description: 'Check if the current root directory has seen changes since last build.',
        handler: async ({ rootDir, debug }) => {
            const changes = new ProjectCompiler(rootDir, {
                detailedLogging: debug,
            });
            await changes.findChanges();
        }
    },
    {
        name: 'build',
        description: 'Run a build and compute the build hash for the provided project root directory.',
        handler: async ({ rootDir, debug }) => {
            const changes = new ProjectCompiler(rootDir, {
                detailedLogging: debug,
            });
            await changes.build();
        }
    }
]);
