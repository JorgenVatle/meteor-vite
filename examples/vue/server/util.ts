import { inspect } from 'node:util';

class LoggerInstance {
    protected log(level: keyof Pick<typeof console, 'info' | 'warn' | 'error'>, args: any[]) {
        console[level]?.apply({}, args.map((arg) => {
            if (typeof arg === 'string') {
                return arg;
            }
            if (arg instanceof Error) {
                return arg;
            }
            return inspect(arg, { depth: 3, colors: true });
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

export const Logger = new LoggerInstance();
