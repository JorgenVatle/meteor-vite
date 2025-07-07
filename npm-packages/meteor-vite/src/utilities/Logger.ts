import { MeteorViteError } from '@/error';
import pc from 'picocolors';

function createLogger<Params extends DefaultParams>(formatter: (...params: Params) => DefaultParams): Logger<Params> {
    const _warnings = new Set<string>(process.env.SUPPRESS_VITE_WARNINGS?.split(',') ?? []);
    return {
        _warnings,
        info: (...params: Params) => console.log(...formatMessage(formatter(...params))),
        warn: (...params: Params) => console.warn(...formatMessage(formatter(...params))),
        error: (...params: Params) => console.error(...formatMessage(formatter(...params))),
        debug: (...params: Params) => process.env.ENABLE_DEBUG_LOGS && console.debug(
            ...formatMessage(formatter(...params)).map((field) => typeof field === 'string' ? pc.dim(field) : field)
        ),
        warnOnce(warning: { id: string }, ...params: Params) {
            if (this._warnings.has(warning.id)) {
                return;
            }
            const leftPad = ' '.repeat(3);
            const SUPPRESS_VITE_WARNINGS = pc.bold('SUPPRESS_VITE_WARNINGS');
            const suppressionNotice = pc.dim([
                `Add ${SUPPRESS_VITE_WARNINGS} to your environment to suppress this warning.`,
                `Example: ${SUPPRESS_VITE_WARNINGS}=${pc.green(`'some-warning,${pc.yellow(warning.id)},another-warning,etc'`)}`,
            ].join(`\n${leftPad}`));
            
            this._warnings.add(warning.id);
            
            console.log('\n');
            
            const lines = [
                params,
                [
                    '\n\n',
                    leftPad,
                    suppressionNotice,
                    '\n\n'
                ].join(''),
            ].flat() as Params;
            
            this.warn(...lines);
        }
    }
}

function formatMessage([message, ...params]: Parameters<typeof console.log>): Parameters<typeof console.log> {
    if (message instanceof MeteorViteError) {
        message.beautify().then(() => console.warn(message, ...params));
        return [];
    }
    if (typeof message === 'string') {
        return [`⚡  ${message}`, ...params];
    }
    return [message, ...params];
}
export type LoggerObject<Params extends DefaultParams = DefaultParams> = { [key in LoggerMethods]: (...params: Params) => void };
type DefaultParams = [...params: unknown[]];
type LoggerMethods = 'info' | 'warn' | 'error' | 'debug';

export const createLabelledLogger = (label: string) => createLogger((
    message: string,
    dataLines?: [key: string, value: string][] | Record<string, string>
) => {
    if (!dataLines) {
        dataLines = []
    }
    if (!Array.isArray(dataLines)) {
        dataLines = Object.entries(dataLines);
    }
    const data = dataLines.map(([key, value]) => {
        return `\n ${pc.dim('L')}  ${key}: ${value}`
    }).join('')
    
    return [`${label} ${message}${data}`]
});

export type LabelLogger = ReturnType<typeof createLabelledLogger>
interface Logger<Params extends DefaultParams> extends LoggerObject<Params> {
    _warnings: Set<string>;
    warnOnce(warning: { id: string }, ...params: DefaultParams): void;
}

export default createLogger((...params: DefaultParams) => params);

export const BuildLogger = {
    info: (message: string, ...params: DefaultParams) => console.info(...formatMessage([pc.blue(message), ...params])),
    success: (message: string, ...params: DefaultParams) => console.log(...formatMessage([pc.green(message), ...params])),
    error: (message: string, ...params: DefaultParams) => console.error(...formatMessage([pc.red(message), ...params])),
    warn: (message: string, ...params: DefaultParams) => console.warn(...formatMessage([pc.yellow(message), ...params])),
    debug: (message: string, ...params: DefaultParams) => process.env.ENABLE_DEBUG_LOGS && console.debug(...formatMessage([pc.dim(message), ...params])),
}

export function createSimpleLogger(label: string, { debug = false } = {}): SimpleLogger {
    const log = (log: typeof console.log, colorize: typeof pc.white) => {
        return (...params: unknown[]) => log(`⚡  ${label} ${colorize('%s')}`, ...params);
    }
    const debugEnabled = debug
        || process.env.ENABLE_DEBUG_LOGS
        || process.env.DEBUG?.toLowerCase()?.includes(`${label.toLowerCase()}:*`)
    
    return {
        info: log(console.info, pc.blue),
        success: log(console.info, pc.green),
        error: log(console.error, pc.red),
        warn: log(console.warn, pc.yellow),
        debug: log(
            debugEnabled ? console.debug : () => {},
            (msg) => pc.dim(pc.blue(msg))
        )
    }
}

export type SimpleLogger = Record<'info' | 'success' | 'warn' | 'debug' | 'error', Function>;