import { envFlag } from '@/utilities/server';
import pc from 'picocolors';

const ENABLE_DEBUG_LOGS = envFlag('ENABLE_DEBUG_LOGS');

export class LoggerInstance {
    protected debugEnabled: boolean;
    protected label: string;
    protected colorizers: Colorizers;
    
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
    
}

interface LoggerConfig {
    label?: string;
    debugKey?: string;
    colorizers?: Partial<Colorizers>
}

type LoggerMethod = 'info' | 'success' | 'warn' | 'debug' | 'error';
type Colorizers = {
    [key in LoggerMethod]: (message: string) => string;
}