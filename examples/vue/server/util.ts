import { inspect } from 'node:util';
import pc from 'picocolors';

class LoggerInstance {
    protected log(level: keyof Pick<typeof console, 'info' | 'warn' | 'error'>, args: any[]) {
        console[level]?.apply({}, args.map((arg) => {
            if (typeof arg === 'string') {
                return arg;
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
        }));
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
}

export function formatErrorMeta(message: string, metadata: object) {
    return [message, inspect(metadata, { colors: true })].join('\n');
}

export const Logger = new LoggerInstance();
