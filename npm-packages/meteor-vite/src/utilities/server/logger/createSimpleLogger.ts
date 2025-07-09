import pc from 'picocolors';

export function createSimpleLogger(label: string, { debug = false } = {}): SimpleLogger {
    const log = (log: typeof console.log, colorize: typeof pc.white) => {
        return (...params: unknown[]) => log(`⚡  ${label} ${colorize('%s')}`, ...params);
    };
    const debugEnabled = debug
        || process.env.ENABLE_DEBUG_LOGS
        || process.env.DEBUG?.toLowerCase()?.includes(`${label.toLowerCase()}:*`);
    
    return {
        info: log(console.info, pc.blue),
        success: log(console.info, pc.green),
        error: log(console.error, pc.red),
        warn: log(console.warn, pc.yellow),
        debug: log(
            debugEnabled ? console.debug : () => {
            },
            (msg) => pc.dim(pc.blue(msg)),
        ),
    };
}

export type SimpleLogger = Record<'info' | 'success' | 'warn' | 'debug' | 'error', Function>;