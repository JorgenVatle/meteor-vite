import { concurrently, type ConcurrentlyCommandInput, type ConcurrentlyOptions } from 'concurrently';

export class CommandConcurrency {
    public readonly commands: CommandInfo[] = [];
    protected readonly extraArgs = new Set<[string] | [string, string[]]>();
    constructor({ inheritOptions = {} }: { inheritOptions?: Record<string, unknown> } = {}) {
        Object.entries(inheritOptions).forEach(([_key, value]) => {
            const key = `--${_key}`;
            if (value === true) {
                this.extraArgs.add([key]);
                return;
            }
            if (typeof value === 'string') {
                this.extraArgs.add([key, [value]]);
                return;
            }
            if (Array.isArray(value)) {
                this.extraArgs.add([key, value]);
                return;
            }
            console.warn(`Unknown option: ${key}=${value}`);
        })
    };
    
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
        return [args, ...this.extraArgs].flat(2).map((arg) => JSON.stringify(arg))
    }
    
    public run(options?: Partial<ConcurrentlyOptions>) {
        return concurrently(this.commands, {
            ...this.defaultOptions,
            ...options,
        }).result;
    }
}

class CommandInstance {
    constructor(protected readonly info: ConcurrentCommand) {}
    
    public setOption(key: string, value: string | boolean | null) {
    
    }
}

type CommandInfo = Extract<ConcurrentlyCommandInput, { command: string }>;
type ConcurrentCommand = {
    command: string;
    args: string[];
} & CommandInfo;