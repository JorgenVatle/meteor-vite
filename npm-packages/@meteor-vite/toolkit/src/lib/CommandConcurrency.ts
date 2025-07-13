import { concurrently, type ConcurrentlyCommandInput, type ConcurrentlyOptions } from 'concurrently';

export class CommandConcurrency<TOptions extends  Record<string, unknown> = {}> {
    public readonly commands: CommandInfo[] = [];
    protected readonly extraArgs = new Set<[string] | [string, string[]]>();
    constructor(
        config: {
            inheritOptions?: TOptions,
            whitelist?: (keyof TOptions)[],
        }
    ) {
        const { inheritOptions = {}, whitelist = [] } = config;
        Object.entries(inheritOptions).forEach(([_key, value]) => {
            if (!whitelist.includes(_key)) {
                return;
            }
            const key = `--${_key}`;
            if (value === true) {
                this.extraArgs.add([key]);
                return;
            }
            if (value === false) {
                this.extraArgs.add([`${key}=false`]);
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