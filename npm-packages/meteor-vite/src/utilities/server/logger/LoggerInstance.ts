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
        this.label = ['⚡  ', label].filter(Boolean).join(' ');
        this.colorizers = {
            info: (message) => message,
            success: (message) => message,
            warn: (message) => message,
            debug: (message) => message,
            error: (message) => pc.dim(message),
        };
        Object.assign(this.colorizers, colorizers);
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