import { CommandNotFound } from '@/errors/CommandFailure';

export class CommandList<TCommand extends CommandSpec> {
    constructor(protected readonly commands: TCommand[]) {
    }
    
    public async run(commandName: TCommand['name'], args: CommandArgs) {
        const command = this.get(commandName);
        await command.handler(args);
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
    handler: (args: CommandArgs) => Promise<void>;
}

type CommandArgs = {
    rootDir: string;
}