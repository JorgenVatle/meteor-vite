function defineColor(prefix: string, suffix: string) {
    return (message: string) => {
        return `${prefix}${message}${suffix}`;
    }
}

export const AnsiColor = {
    dim: defineColor('\x1b[2m', '\x1b[22m'),
    green: defineColor('\x1b[32m', '\x1b[39m'),
    blue: defineColor('\x1b[34m', '\x1b[39m'),
    red: defineColor('\x1b[31m', '\x1b[39m'),
};