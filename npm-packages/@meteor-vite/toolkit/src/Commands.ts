import { Command } from '@/lib/Command';
import { CommandList } from '@/lib/CommandList';
import { Highlight } from '@/lib/Highlight';
import { ProjectCompiler } from '@/ProjectCompiler';

export const Commands = new CommandList([
    new Command('check-changes', {
        description: 'Check if the current root directory has seen changes since last build.',
        fields: {},
        handler: async () => {
            await ProjectCompiler.init().getHash();
        }
    }),
    new Command('build', {
        description: 'Run a build and compute the build hash for the provided project root directory.',
        fields: {},
        handler: async () => {
            await ProjectCompiler.init().build();
        }
    }),
    new Command('clean', {
        description: `Clean the build output directory (${Highlight.filePath('/dist')}) for the current project.`,
        fields: {},
        handler: async () => {
            await ProjectCompiler.init().clean();
        }
    }),
]);