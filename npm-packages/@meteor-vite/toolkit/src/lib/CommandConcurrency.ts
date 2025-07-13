import { concurrently, type ConcurrentlyCommandInput, type ConcurrentlyOptions } from 'concurrently';

export class CommandConcurrency {
    constructor(
        protected readonly commands: ConcurrentCommand[] = []
    ) {};
    
    protected readonly defaultOptions: Partial<ConcurrentlyOptions> = {
        killOthersOn: 'failure',
    };
    
    public add(command: ConcurrentCommand) {
        this.commands.push(command);
    };
    
    protected formatArgs(args: string[]) {
        return args.map((arg) => JSON.stringify(arg))
    }
    
    public run(options?: Partial<ConcurrentlyOptions>) {
        const commands: CommandInfo[] = this.commands.map(({ command, args, ...options }) => {
            return {
                command: [command, this.formatArgs(args)].flat().join(' '),
                ...options,
            }
        });
        return concurrently(commands, {
            ...this.defaultOptions,
            ...options,
        }).result;
    }
}

type CommandInfo = Extract<ConcurrentlyCommandInput, { command: string }>;
type ConcurrentCommand = {
    command: string;
    args: string[];
} & CommandInfo;