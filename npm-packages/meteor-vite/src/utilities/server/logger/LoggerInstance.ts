import { envFlag } from '@/utilities/server';
import pc from 'picocolors';

const ENABLE_DEBUG_LOGS = envFlag('ENABLE_DEBUG_LOGS');

export class LoggerInstance {
    protected debugEnabled: boolean;
    protected label: string;
    protected colorizers: Colorizers;
    protected static readonly warnings = new Set<string>(process.env.SUPPRESS_VITE_WARNINGS?.split(',') ?? []);
    
    constructor({ 
        debugKey = 'meteor-vite',
        label,
        colorizers,
    }: LoggerConfig) {
        const debugEnv = process.env.DEBUG || 'false';
        const debugTriggers = [debugKey, 'true', '*'];
        this.debugEnabled = ENABLE_DEBUG_LOGS || !!debugEnv.trim().split(/[\s,]+/).find((field) => {
            return debugTriggers.includes(field.trim())
        });
        this.label = ['⚡  ', label].filter(Boolean).join('');
        this.colorizers = {
            info: (message) => pc.blue(message),
            success: (message) => pc.green(message),
            warn: (message) => pc.yellow(message),
            debug: (message) => pc.dim(pc.blue(message)),
            error: (message) => pc.dim(message),
        };
        Object.assign(this.colorizers, colorizers);
    }
    
    protected log(level: Exclude<LoggerMethod, 'success'>, params: unknown[]) {
        console[level](`${this.label} ${this.colorizers[level]('%s')}`, ...params)
    }
    
    public info(...params: unknown[]) {
        this.log('info', params);
    }
    
    public success(...params: unknown[]) {
        this.log('info', params);
    }
    
    public warn(...params: unknown[]) {
        this.log('warn', params);
    }
    
    public error(...params: unknown[]) {
        this.log('error', params);
    }
    
    public debug(...params: unknown[]) {
        if (!this.debugEnabled) {
            return;
        }
        this.log('debug', params);
    }
    
    public warnOnce(warning: { id: string }, ...params: LoggerParams) {
        if (LoggerInstance.warnings.has(warning.id)) {
            return;
        }
        const leftPad = ' '.repeat(3);
        const SUPPRESS_VITE_WARNINGS = pc.bold('SUPPRESS_VITE_WARNINGS');
        const suppressionNotice = pc.dim([
            `Add ${SUPPRESS_VITE_WARNINGS} to your environment to suppress this warning.`,
            `Example: ${SUPPRESS_VITE_WARNINGS}=${pc.green(`'some-warning,${pc.yellow(warning.id)},another-warning,etc'`)}`,
        ].join(`\n${leftPad}`));
        
        LoggerInstance.warnings.add(warning.id);
        
        console.log('\n');
        
        const lines = [
            params,
            [
                '\n\n',
                leftPad,
                suppressionNotice,
                '\n\n',
            ].join(''),
        ].flat();
        
        this.warn(...lines);
    }
    
}

type LoggerParams = [...params: unknown[]];
interface LoggerConfig {
    label?: string;
    debugKey?: string;
    colorizers?: Partial<Colorizers>
}

type LoggerMethod = 'info' | 'success' | 'warn' | 'debug' | 'error';
type Colorizers = {
    [key in LoggerMethod]: (message: string) => string;
}