import { Command } from '@/lib/Command';
import { CommandList } from '@/lib/CommandList';
import { Highlight } from '@/lib/Highlight';
import { ProjectCompiler } from '@/ProjectCompiler';
import { concurrently } from 'concurrently';

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
            const compiler = new ProjectCompiler(options)
            const commands: { command: string, arguments: string[] }[] = [];
            if (options.concurrent) {
                options.concurrent.forEach(rootDir => {
                    commands.push({
                        command: process.argv[1],
                        arguments: ['build', rootDir, '--watch']
                    })
                })
            }
            if (options.run) {
                const [command, ...args] = options.run;
                commands.push({
                    command,
                    arguments: args,
                });
            }
            if (!commands.length) {
                await compiler.build();
                return;
            }
            try {
                await concurrently(commands, {
                    prefix: 'none',
                    restartTries: 0,
                    killOthers: ['failure'],
                }).result
            } catch (error) {
                console.error(error);
            }
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