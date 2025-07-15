import { inspect } from 'node:util';
import pc from 'picocolors';

export class LoggerInstance {
    
    constructor(protected readonly options: { prefix?: string, suffix?: string } = {}) {
    }
    
    protected log(level: keyof Pick<typeof console, 'info' | 'warn' | 'error' | 'debug'>, args: any[]) {
        let colorize = (value: string) => value;
        
        if (level === 'debug') {
            colorize = pc.dim;
        }
        
        const formattedArgs = args.map((arg) => {
            if (typeof arg === 'string') {
                return colorize(arg);
            }
            if (arg instanceof Error) {
                return pc.white(arg.stack?.split(/[\r\n]/).map((line, index) => {
                    if (index === 0) {
                        const [name, ...message] = line.split(':');
                        return [pc.bgRed(pc.white(name)), pc.red(message.join(' '))].join(' ');
                    }
                    return pc.white(line);
                }).join('\n'));
            }
            return inspect(arg, { depth: 3, colors: true, getters: true });
        });
        
        if (this.options.prefix) {
            formattedArgs.unshift(this.options.prefix);
        }
        
        if (this.options.suffix) {
            formattedArgs.push(this.options.suffix);
        }
        
        console[level]?.apply({}, formattedArgs);
    }
    
    public info(...args: any[]) {
        this.log('info', args);
    }
    
    public warn(...args: any[]) {
        this.log('warn', args);
    }
    
    public error(...args: any[]) {
        this.log('error', args);
    }
    
    public debug(...args: any[]) {
        this.log('debug', args);
    }
}

export function formatErrorMeta(message: string, metadata: object) {
    return [message, inspect(metadata, { colors: true })].join('\n');
}

export const Logger = new LoggerInstance();
