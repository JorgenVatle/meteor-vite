import { CommandList } from '@/lib/CommandList';
import { Highlight } from '@/lib/Highlight';
import { ProjectCompiler } from '@/ProjectCompiler';

const options = () => {
    return {
        compiler: new ProjectCompiler(ProjectCompiler.parseOptions()),
    };
}

export const Commands = new CommandList({
    'check-changes': {
        description: 'Check if the current root directory has seen changes since last build.',
        options,
        handler: async ({ compiler }) => {
            await compiler.getHash();
        }
    },
    'build': {
        description: 'Run a build and compute the build hash for the provided project root directory.',
        options,
        handler: async ({ compiler }) => {
            await compiler.build();
        }
    },
    'clean': {
        description: `Clean the build output directory (${Highlight.filePath('/dist')}) for the current project.`,
        options,
        handler: async ({ compiler }) => {
            await compiler.clean();
        }
    }
});
