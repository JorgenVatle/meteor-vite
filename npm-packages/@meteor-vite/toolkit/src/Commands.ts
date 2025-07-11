import { CommandList } from '@/lib/CommandList';

export const Commands = new CommandList([
    {
        name: 'check-changes',
        description: 'Check if the current root directory has seen changes since last build.',
        handler: async ({ compiler }) => {
            await compiler.getHash();
        }
    },
    {
        name: 'build',
        description: 'Run a build and compute the build hash for the provided project root directory.',
        handler: async ({ compiler }) => {
            await compiler.build();
        }
    }
]);
