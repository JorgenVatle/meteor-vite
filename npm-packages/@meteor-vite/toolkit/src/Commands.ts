import { CommandList } from '@/lib/CommandList';
import { ProjectCompiler } from '@/ProjectCompiler';

export const Commands = new CommandList([
    {
        name: 'check-changes',
        description: 'Check if the current root directory has seen changes since last build.',
        handler: async ({ rootDir }) => {
            const changes = new ProjectCompiler(rootDir, {
                detailedLogging: true,
                saveBuildHash: false,
            });
            await changes.findChanges();
        }
    },
    {
        name: 'build',
        description: 'Run a build and compute the build hash for the provided project root directory.',
        handler: async ({ rootDir }) => {
            const changes = new ProjectCompiler(rootDir);
            await changes.build();
        }
    }
]);
