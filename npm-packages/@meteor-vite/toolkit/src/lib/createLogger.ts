import { createLogger as tsupLogger, type Logger } from 'tsup';

export function createLogger(name: string): Logger {
    return tsupLogger(name);
}

declare module 'tsup' {
    type Logger = ReturnType<typeof createLogger>;
    const createLogger: (name?: string) => {
        setName(_name: string): void;
        success(label: string, ...args: any[]): void;
        info(label: string, ...args: any[]): void;
        error(label: string, ...args: any[]): void;
        warn(label: string, ...args: any[]): void;
        log(label: string, type: "info" | "success" | "error" | "warn", ...data: unknown[]): void;
    };
}