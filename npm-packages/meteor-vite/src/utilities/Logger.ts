import pc from 'picocolors';
import { MeteorViteError } from '../error/MeteorViteError';

function createLogger<Params extends DefaultParams>(formatter: (...params: Params) => DefaultParams): LoggerObject<Params> {
    return {
        info: (...params: Params) => console.log(...formatMessage(formatter(...params))),
        warn: (...params: Params) => console.warn(...formatMessage(formatter(...params))),
        error: (...params: Params) => console.error(...formatMessage(formatter(...params))),
        debug: (...params: Params) => process.env.ENABLE_DEBUG_LOGS && console.debug(
            ...formatMessage(formatter(...params)).map((field) => typeof field === 'string' ? pc.dim(field) : field)
        ),
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

export default createLogger((...params: DefaultParams) => params);
