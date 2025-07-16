import pc from 'picocolors';

export function log (...messages: unknown[]) {
    console.log(...messages.map((message) => {
        if (typeof message === 'string') {
            return pc.cyan(message);
        }
        return message;
    }));
}