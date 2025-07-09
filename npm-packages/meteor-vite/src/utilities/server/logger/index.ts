import pc from 'picocolors';
import { createLogger, type DefaultParams } from './createLogger';
import { formatMessage } from './formatMessage';

export const Logger = createLogger((...params: DefaultParams) => params);

export const BuildLogger = {
    info: (message: string, ...params: DefaultParams) => console.info(...formatMessage([pc.blue(message), ...params])),
    success: (message: string, ...params: DefaultParams) => console.log(...formatMessage([pc.green(message), ...params])),
    error: (message: string, ...params: DefaultParams) => console.error(...formatMessage([pc.red(message), ...params])),
    warn: (message: string, ...params: DefaultParams) => console.warn(...formatMessage([pc.yellow(message), ...params])),
    debug: (message: string, ...params: DefaultParams) => process.env.ENABLE_DEBUG_LOGS && console.debug(...formatMessage([pc.dim(message), ...params])),
}

export { createSimpleLogger, type SimpleLogger } from './createSimpleLogger';
export { createLabelledLogger } from './createLabelledLogger';
export { type LoggerObject, type DefaultParams } from './createLogger';
