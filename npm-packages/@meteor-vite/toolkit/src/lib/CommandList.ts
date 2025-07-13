import { CommandNotFound } from '@/errors/CommandFailure';
import type { CommandSpec } from '@/lib/CommandDefinition';

export class CommandList<
    TCommands extends CommandSpec[],
    TOptions extends {
        [key in keyof TCommands]: { [k in TCommands[key]['name']]: TCommands[key] };
    }[keyof TCommands],
    TCommand extends Extract<TCommands[number]['name'], string>,
> {
    
    constructor(
        protected readonly commands: [...TCommands]
    ) {}
    
    public async run<TName extends TCommand>(commandName: TName, options: TOptions[TName]) {
        const command = this.get(commandName);
        await command.run(options);
    }
    
    protected get<TName extends TCommand>(commandName: TName) {
        const command = this.commands.find((command) => command.name === commandName);
        
        if (!command) {
            throw new CommandNotFound(`Unknown command: ${commandName}`);
        }
        
        return command;
    }
    
}