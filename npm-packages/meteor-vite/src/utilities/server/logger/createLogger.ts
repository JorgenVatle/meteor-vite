import pc from 'picocolors';
import { formatMessage } from './formatMessage';

export function createLogger<Params extends DefaultParams>(formatter: (...params: Params) => DefaultParams): Logger<Params> {
    const _warnings = new Set<string>(process.env.SUPPRESS_VITE_WARNINGS?.split(',') ?? []);
    const log = (level: LoggerMethods) => (...params: Params) => console[level]?.apply({}, formatMessage(formatter.apply({}, params)));
    
    return {
        _warnings,
        info: log('info'),
        warn: log('warn'),
        error: log('error'),
        debug: (...params: Params) => process.env.ENABLE_DEBUG_LOGS && console.debug(
            ...formatMessage(formatter(...params)).map((field) => typeof field === 'string' ? pc.dim(field) : field),
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
                    '\n\n',
                ].join(''),
            ].flat() as Params;
            
            this.warn(...lines);
        },
    };
}

export type LoggerObject<Params extends DefaultParams = DefaultParams> = { [key in LoggerMethods]: (...params: Params) => void };
export type DefaultParams = [...params: unknown[]];
type LoggerMethods = 'info' | 'warn' | 'error' | 'debug';

export interface Logger<Params extends DefaultParams> extends LoggerObject<Params> {
    _warnings: Set<string>;
    
    warnOnce(warning: { id: string }, ...params: DefaultParams): void;
}

