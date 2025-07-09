import { LoggerInstance } from '@/utilities/server';

export function createSimpleLogger(label: string, { debugKey = 'meteor-vite' } = {}): LoggerInstance {
    return new LoggerInstance({
        label,
        debugKey,
    });
}
