import { MeteorViteError } from '@/internals/error/MeteorViteError';

export function formatMessage([message, ...params]: Parameters<typeof console.log>): Parameters<typeof console.log> {
    if (message instanceof MeteorViteError) {
        message.beautify().then(() => console.warn(message, ...params));
        return [];
    }
    if (typeof message === 'string') {
        return [`⚡  ${message}`, ...params];
    }
    return [message, ...params];
}