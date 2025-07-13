import { CommandNotFound } from '@/errors/CommandFailure';
import type { CommandSpec } from '@/lib/CommandDefinition';
import { Parser } from '@/lib/CommandLineArgs/defineParser';
import pc from 'picocolors';

export class CommandList<
    TCommands extends CommandSpec[],
    TOptions extends {
        [key in keyof TCommands]: { [k in TCommands[key]['name']]: TCommands[key] };
    }[keyof TCommands],
    TCommand extends Extract<TCommands[number]['name'], string>,
> {
    
    protected readonly parser;
    
    constructor(
        protected readonly commands: [...TCommands]
    ) {
        this.parser = new Parser({
            command: {
                type: String,
                description: 'Command to run',
                defaultOption: true,
                optional: true,
            },
            help: {
                type: Boolean,
                alias: 'h',
                description: 'Show help',
                defaultValue: false,
            }
        }, {
            helpArg: 'help',
            partial: true,
            headerContentSections: [
                { header: 'Meteor Vite Toolkit', content: 'A collection of tools for Meteor and Vite.' },
                { header: 'Usage', content: '$ toolkit <command> [options]' },
            ],
            footerContentSections: [
                { header: 'Commands',  },
                ...this.commands.map(({ name, config }) => {
                    return {
                        header: config.title,
                        content: [
                            `${pc.dim('$ toolkit')} ${pc.yellow(name)}`,
                            config.description
                        ],
                    }
                }),
                { header: 'Global Options', content: []}
            ]
        });
    }
    
    public async runWithParser() {
        const { command: name, _unknown } = this.parser.parse({
            partial: true,
        });
        return await this.run(name as any, _unknown);
    }
    
    public async run<TName extends TCommand>(commandName: TName, argv: string[], options?: TOptions[TName]) {
        const command = this.get(commandName);
        await command.run(argv, options);
    }
    
    protected get<TName extends TCommand>(commandName: TName) {
        const command = this.commands.find((command) => command.name === commandName);
        
        if (!command) {
            this.parser.printHelp(`Unknown command: ${commandName}`, [
                { content: 'Try some of the above commands, or run toolkit --help for a list of all commands.' },
            ]);
            throw new CommandNotFound(`Unknown command: ${commandName}`);
        }
        
        return command;
    }
    
}