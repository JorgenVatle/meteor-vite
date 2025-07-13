import { CommandNotFound } from '@/errors/CommandFailure';

export class CommandList<
    TOptions extends { [key in string]: unknown },
    TCommand extends Extract<keyof TOptions, string>,
> {
    
    constructor(
        protected readonly commands: {
            [key in keyof TOptions]: CommandSpec<TOptions[key]>
        }) {
    }
    
    public async run<TName extends TCommand>(commandName: TName, options: TOptions[TName]) {
        const command = this.get(commandName);
        await command.handler(options);
    }
    
    protected get<TName extends TCommand>(commandName: TName) {
        const command = this.commands[commandName];
        
        if (!command) {
            throw new CommandNotFound(`Unknown command: ${commandName}`);
        }
        
        return command;
    }
    
    
    public static defineOptions<
        TOptions extends OptionSpec,
        TType = {
            [key in keyof TOptions]: TOptions[key]['default'];
        }
    >(options: TOptions): {
        parse(params: string[]): TType;
        default: TType;
    } {
        const parse = (params: string[]) => {
            const result: Record<string, any> = {};
            
            Object.entries(options).forEach(([key, value]) => {
                if (params.includes(`--${key}`)) {
                    result[key] = true;
                } else {
                    result[key] = value.default;
                }
            })
            
            return result as any;
        };
        
        return {
            default: parse([]),
            parse,
        }
    }
    
}

export type CommandSpec<
    TParsedOptions = unknown,
> = {
    description: string;
    options: () => TParsedOptions;
    handler: (args: NoInfer<TParsedOptions>) => Promise<void>;
}

type OptionSpec = Record<string, {
    default: unknown;
}>