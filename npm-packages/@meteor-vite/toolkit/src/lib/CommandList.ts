import { CommandFailure, CommandNotFound } from '@/errors/CommandFailure';
import type { CommandSpec } from '@/lib/CommandDefinition';
import { Parser } from '@/lib/CommandLineArgs/defineParser';
import { GlobalConfig } from '@/lib/GlobalConfig';
import pc from 'picocolors';
import type { Content } from 'ts-command-line-args/src/contracts';

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
                { header: 'Global Options', content: Object.entries(GlobalConfig.parser.fields).map(([name, field]) => {
                    return `${pc.dim('$ toolkit')} --${name} ${pc.yellow(field.typeLabel || field.type.name)}`;
                })}
            ]
        });
    }
    
    public get commandsList(): Content[] {
        return this.commands.map(({ name, config }) => {
            return {
                header: config.title,
                content: config.description,
            }
        })
    }
    
    public async runWithParser(argv?: string[]) {
        const { command: name, _unknown } = this.parser.parse({
            partial: true,
            argv,
        });
        return await this.run(name as any, _unknown);
    }
    
    public async run<TName extends TCommand>(commandName: TName, argv?: string[], options?: TOptions[TName]) {
        try {
            if (GlobalConfig.debug) {
                console.log({ commandName, argv, trace: new Error(), proc: process.argv });
            }
            const command = this.get(commandName);
            await command.run(argv, options);
        } catch (error) {
            if (!(error instanceof CommandFailure)) {
                throw error;
            }
            
            process.exitCode = 1;
            console.error(error.message);
        }
    }
    
    protected get<TName extends TCommand>(commandName: TName) {
        const command = this.commands.find((command) => command.name === commandName);
        
        if (!command) {
            this.parser.printHelp(`Unknown command: ${commandName}`, [
                { content: pc.dim(`(${process.argv.join(' ')})`) },
                { content: 'Try some of the above commands, or run toolkit --help for a list of all commands.' },
            ]);
            throw new CommandNotFound(`Unknown command: ${commandName}`);
        }
        
        return command;
    }
    
}