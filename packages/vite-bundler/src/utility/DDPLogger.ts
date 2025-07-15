import pc from 'picocolors';
import type { BaseDocument, DataStreamDocument, DataStreamLogType } from '../api/Collections';
import { Methods } from '../api/Endpoints';
import { inspect } from 'node:util';
import { AnsiColor } from './AnsiColor';

class DDPLogger {
    protected readonly type: DataStreamLogType = 'log:shared';
    
    constructor() {
        if (Meteor.isServer) {
            this.type = 'log:client';
        }
    }
    
    protected send(log: Omit<DataStreamDocument, 'type' | keyof BaseDocument> & { args: unknown[] }) {
        const document: Omit<DataStreamDocument, keyof BaseDocument> = Object.assign({}, log, {
            type: this.type,
            message: [log.message, ...this.serializeArgs(log.args)].join(' '),
        });
        
        if (!Meteor.isServer) {
            Meteor.callAsync('meteor-vite:log', document).catch((error) => {
                console.error('Failed to log message', error);
            });
            return;
        }
        
        Methods['meteor-vite:log'](document).catch((error) => {
            console.error('Failed to log message', error);
        });
    }
    
    protected styleMessage(data: Pick<DataStreamDocument, 'message' | 'level' | 'sender'>) {
        const prefix = data.sender ? AnsiColor.dim(`[${data.sender}]`) + ' ' : '';
        const message = `⚡  ${prefix}${data.message}`;
        switch (data.level) {
            case 'info':
                return pc.blue(message);
            case 'error':
                return pc.red(message);
            case 'warn':
                return pc.yellow(message);
            case 'success':
                return pc.green(message);
            case 'debug':
                return pc.dim(pc.blue(message));
        }
    }
    
    protected serializeArgs(args: LogMethodArgs) {
        return args.map((data) => {
            return inspect(data, { depth: 2, colors: true });
        });
    }
    
    public print(log: DataStreamDocument) {
        const levels: Record<DataStreamDocument['level'], (...args: LogMethodArgs) => void> = {
            info: (message: unknown, ...args: unknown[]) => console.info(this.styleMessage({ message: String(message), level: 'info', sender: log.sender }), ...args),
            error: (message: unknown, ...args: unknown[]) => console.error(this.styleMessage({ message: String(message), level: 'error', sender: log.sender }), ...args),
            warn: (message: unknown, ...args: unknown[]) => console.warn(this.styleMessage({ message: String(message), level: 'warn', sender: log.sender }), ...args),
            success: (message: unknown, ...args: unknown[]) => console.log(this.styleMessage({ message: String(message), level: 'success', sender: log.sender }), ...args),
            debug: (message: unknown, ...args: unknown[]) => console.debug(this.styleMessage({ message: String(message), level: 'debug', sender: log.sender }), ...args),
        }
        
        if (log.level in levels) {
            return levels[log.level](log.message);
        }
        
        console.error('Unknown log level', log);
    }
    
    public info(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'info' });
    }
    public error(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'error' });
    }
    public warn(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'warn' });
    }
    public success(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'success' });
    }
    public debug(message: string, ...args: LogMethodArgs) {
        this.send({ message, args, level: 'debug' });
    }
}

type LogMethodArgs = unknown[];

export default new DDPLogger();