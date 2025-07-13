import { Command } from '@/lib/Command';
import { CommandConcurrency } from '@/lib/CommandConcurrency';
import { CommandList } from '@/lib/CommandList';
import { Highlight } from '@/lib/Highlight';
import { ProjectCompiler } from '@/ProjectCompiler';

export const Commands = new CommandList([
    new Command('check-changes', {
        description: 'Check if the current root directory has seen changes since last build.',
        fields: ProjectCompiler.parser.fields,
        handler: async (options) => {
            const compiler = new ProjectCompiler(options)
            await compiler.getHash();
        }
    }),
    new Command('build', {
        description: 'Run a build and compute the build hash for the provided project root directory.',
        fields: {
            ...ProjectCompiler.parser.fields,
            concurrent: {
                type: String,
                description: 'Run the same command in parallel within the root directories specified',
                multiple: true,
                optional: true,
                typeLabel: 'rootDir1 rootDir2 ...',
            },
            run: {
                type: String,
                description: 'Runs the provided command in a separate process concurrently with the build.',
                multiple: true,
                optional: true,
            },
        },
        handler: async (options) => {
            const concurrency = new CommandConcurrency();
            const compiler = new ProjectCompiler(options)
            
            if (options.concurrent) {
                options.concurrent.forEach(rootDir => {
                    const [node, script] = process.argv;
                    concurrency.add({
                        command: node,
                        args: [script, 'build', rootDir, '--watch']
                    })
                })
            }
            if (options.run) {
                const [command, ...args] = options.run;
                concurrency.add({
                    command,
                    args,
                });
            }
            
            if (!concurrency.commands.length) {
                await compiler.build();
                return;
            }
            
            await concurrency.run();
        }
    }),
    new Command('clean', {
        description: `Clean the build output directory (${Highlight.filePath('/dist')}) for the current project.`,
        fields: ProjectCompiler.parser.fields,
        handler: async (options) => {
            const compiler = new ProjectCompiler(options)
            await compiler.clean();
        }
    }),
]);