import { CommandConcurrency } from '@/lib/CommandConcurrency';
import { CommandDefinition } from '@/lib/CommandDefinition';
import { Highlight } from '@/lib/Highlight';
import { ProjectCompiler } from '@/ProjectCompiler';
import Path from 'path';

export default [
    new CommandDefinition('check-changes', {
        description: 'Check if the current root directory has seen changes since last build.',
        fields: ProjectCompiler.parser.fields,
        handler: async (options) => {
            const compiler = new ProjectCompiler(options)
            await compiler.getHash();
        }
    }),
    new CommandDefinition('build', {
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
            const concurrency = new CommandConcurrency({
                inheritOptions: options,
                whitelist: [
                    'watch',
                    'summary',
                    'verbose',
                    'force'
                ]
            });
            const compiler = new ProjectCompiler(options)
            
            if (options.concurrent) {
                options.concurrent.forEach(rootDir => {
                    const [node, script] = process.argv;
                    concurrency.add({
                        command: node,
                        args: [script, 'build'],
                        cwd: Path.join(process.cwd(), rootDir),
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
    new CommandDefinition('clean', {
        description: `Clean the build output directory (${Highlight.filePath('/dist')}) for the current project.`,
        fields: {
            ...ProjectCompiler.parser.fields,
            ws: {
                type: Boolean,
                description: 'Clean the build output directory for all workspaces.',
                defaultValue: false,
            }
        },
        handler: async (options) => {
            const compiler = new ProjectCompiler(options);
            const project = await compiler.getProjectInfo();
            
            if (!options.ws) {
                await compiler.clean();
                return;
            }
            
            if (!project.workspaces) {
                throw new Error(`Missing workspaces field in ${compiler.filePath.packageJson}`);
            }
            
            console.log('Cleaning up workspaces', project.workspaces);
            
            const concurrency = new CommandConcurrency({
                inheritOptions: options,
                whitelist: [
                    'watch',
                    'summary',
                    'verbose',
                    'force'
                ]
            });
            
            project.workspaces.forEach(workspace => {
                const [node, script] = process.argv;
                concurrency.add({
                    command: node,
                    args: [script, 'clean', workspace]
                })
            })
            
            await concurrency.run();
        }
    }),
    new CommandDefinition('run', {
        description: 'Run a command within the context of the provided project root directory.',
        fields: {
            ...ProjectCompiler.parser.fields,
            command: {
                type: String,
                multiple: true,
                defaultOption: true,
            },
            build: {
                type: String,
                description: 'Run build build command in provided workspace roots concurrently with the provided command.',
                typeLabel: 'rootDir1 rootDir2 ...',
                multiple: true,
                optional: true,
            }
        },
        handler: async ({ build, command, ...options }) => {
            const concurrency = new CommandConcurrency({
                inheritOptions: options,
                whitelist: [
                    'watch',
                    'summary',
                    'verbose',
                    'force'
                ]
            });
            
            build?.forEach(rootDir => {
                const [node, script] = process.argv;
                const args = [script, 'build', '--rootDir', rootDir]
                concurrency.add({
                    command: node,
                    args,
                })
            })
            
            concurrency.add(command);
            
            await concurrency.run();
        }
    })
]