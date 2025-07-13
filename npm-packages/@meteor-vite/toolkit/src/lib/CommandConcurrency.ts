import { concurrently, type ConcurrentlyCommandInput, type ConcurrentlyOptions } from 'concurrently';

export class CommandConcurrency {
    constructor(
        protected readonly commands: CommandInfo[] = []
    ) {};
    
    protected readonly defaultOptions: Partial<ConcurrentlyOptions> = {
        killOthersOn: 'failure',
    };
    
    public add({ command, args, ...options }: ConcurrentCommand) {
        this.commands.push({
            command: [command, this.formatArgs(args)].flat().join(' '),
            ...options,
        });
    };
    
    protected formatArgs(args: string[]) {
        return args.map((arg) => JSON.stringify(arg))
    }
    
    public run(options?: Partial<ConcurrentlyOptions>) {
        return concurrently(this.commands, {
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