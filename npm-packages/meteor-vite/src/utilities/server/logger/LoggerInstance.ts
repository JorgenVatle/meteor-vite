import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { GithubActionsAnnotator } from '@/utilities/server/logger/GithubActionsAnnotator';
import pc from 'picocolors';
import { inspect } from 'util';
import { envFlag } from '../EnvFlag';

const ENABLE_DEBUG_LOGS = envFlag('ENABLE_DEBUG_LOGS');

export class LoggerInstance {
    protected debugEnabled: boolean;
    protected label: string;
    protected colorizers: Colorizers;
    protected static readonly warnings = new Set<string>(process.env.SUPPRESS_VITE_WARNINGS?.split(',') ?? []);
    protected actions = new GithubActionsAnnotator();
    protected debugKey: string;
    
    constructor({ 
        debugKey,
        label,
        colorizers,
    }: LoggerConfig) {
        const debugEnv = process.env.DEBUG || 'false';
        this.debugKey = debugKey || label || 'meteor-vite';
        const debugTriggers = [`${this.debugKey}:*`, 'true', '*'];
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
    
    protected log(level: LoggerMethod, _params: LoggerParams) {
        const params = this.formatMessage(level, _params);
        if (!params) {
            return;
        }
        if (level === 'success') {
            return console.info(...params);
        }
        console[level](...params);
    }
    
    protected formatMessage(level: LoggerMethod, [message, ...params]: LoggerParams) {
        if (message instanceof MeteorViteError) {
            message.beautify().then(() => console.warn(message, ...params));
            return null;
        }
        if (typeof message === 'string') {
            return [`${this.label} ${this.colorizers[level](message)}`, ...params];
        }
        if (level === 'debug') {
            return [message, params.map((field) => {
                if (typeof field === 'string') {
                    return pc.dim(field);
                }
                if (field instanceof Error) {
                    return pc.dim(field.stack ?? field.message);
                }
                return pc.dim(inspect(field, { colors: true, }))
            })].flat()
        }
        return [this.label, message, ...params];
    }
    
    public info(...params: LoggerParams) {
        this.log('info', params);
    }
    
    public success(...params: LoggerParams) {
        this.log('success', params);
    }
    
    public warn(...params: LoggerParams) {
        this.log('warn', params);
    }
    
    public error(...params: LoggerParams) {
        this.actions.annotate(params, { title: this.label });
        this.log('error', params);
    }
    
    public debug(...params: LoggerParams) {
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

export type LoggerParams = [...params: unknown[]];
interface LoggerConfig {
    label?: string;
    debugKey?: string;
    colorizers?: Partial<Colorizers>
}

export type LoggerMethod = 'info' | 'success' | 'warn' | 'debug' | 'error';
type Colorizers = {
    [key in LoggerMethod]: (message: string) => string;
}