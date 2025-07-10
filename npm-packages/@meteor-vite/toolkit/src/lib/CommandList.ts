import { CommandNotFound } from '@/errors/CommandFailure';
import type { CommandOptions } from '@/lib/parseCliParams';

export class CommandList<TCommand extends CommandSpec> {
    constructor(protected readonly commands: TCommand[]) {
    }
    
    public async run(commandName: TCommand['name'], options: CommandOptions) {
        const command = this.get(commandName);
        await command.handler(options);
    }
    
    protected get(commandName: TCommand['name']) {
        const command = this.commands.find((command) => command.name === commandName);
        
        if (!command) {
            throw new CommandNotFound(`Unknown command: ${commandName}`);
        }
        
        return command;
    }
    
}

export type CommandSpec = {
    name: string;
    description: string;
    handler: (args: CommandOptions) => Promise<void>;
}