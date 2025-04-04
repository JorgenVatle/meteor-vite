import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import safeJson from 'safe-json-stringify';
import Chalk from 'chalk';
import util from 'util';
const chalk = new Chalk.Instance({ level: 3 });

interface LogEntry {
    createdAt: Date;
    level: LogLevel;
    args: any[];
}

export const LogsCollection = new Mongo.Collection<LogEntry>('log-entries');

if (Meteor.isServer) {
    function printEntry(entry: LogEntry) {
        const rawMessage = util.formatWithOptions(
            { colors: true },
            ...entry.args.map(arg => JSON.parse(arg))
        );
        const message = rawMessage.split(/[\n\r]+/)
            .map((line) => `[${chalk.bold.cyan('Client')}] ${line}`)
            .join('\n');
        process.stdout.write(message + '\n');
    }
    
    const insertHook = (userId: string | null, entry: LogEntry) => {
        const logFunction = console[entry.level];
        
        if (!isLogMethod(entry.level, logFunction)) {
            console.warn('Unknown "%s" log level from client', entry.level, entry.args)
            return false;
        }
        
        printEntry(entry);
        return true;
    }
    
    LogsCollection.allow({
        insert: insertHook,
        insertAsync: insertHook,
    })
}

export const Logger: typeof console = new Proxy(console, {
    get(target, level: LogLevel) {
        const value = target[level as keyof typeof console];
        
        if (!isLogMethod(level, value)) {
            return value;
        }
        
        return (...args: any[]) => {
            LogsCollection.insertAsync({
                createdAt: new Date(),
                level,
                args: args.map(arg => safeJson(arg)),
            }).catch(() => {
                // Ignore error to prevent infinite logging loop.
                // Meteor appears to emit an error message anyway, regardless of whether the exception is handled
            });
            value.apply(this, args);
        }
    }
});

export function WrapConsole() {
    if (!Meteor.isClient) {
        throw new Error('wrapConsole() can only be called on the client');
    }
    
    for (const level of loggableLevels) {
        Object.defineProperty(window.console, level, {
            value: Logger[level],
        })
    }
}

type LogLevel = typeof loggableLevels[number];
const loggableLevels = [ 'log', 'info', 'warn', 'error'] as const;
function isLogMethod(level: LogLevel | string, value: any): value is typeof console[LogLevel]  {
    return loggableLevels.includes(level as LogLevel);
}
