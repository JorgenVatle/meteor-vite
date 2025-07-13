import { concurrently, type ConcurrentlyCommandInput, type ConcurrentlyOptions } from 'concurrently';

export class CommandConcurrency {
    constructor(
        public readonly commands: CommandInfo[] = []
    ) {};
    
    protected readonly defaultOptions: Partial<ConcurrentlyOptions> = {
        killOthersOn: 'failure',
    };
    
    public add(params: string[]): void
    public add(params: ConcurrentCommand): void;
    public add(params: string[] | ConcurrentCommand): void {
        if (Array.isArray(params)) {
            const [command, ...args] = params;
            this.add({ command, args });
            return;
        }
        this.commands.push({
            ...params,
            command: [params.command, this.formatArgs(params.args)].flat().join(' '),
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