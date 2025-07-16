export function envFlag<T extends keyof NodeJS.ProcessEnv>(flag: T, { defaultValue = false } = {}): boolean {
    try {
        const value = JSON.parse(process.env[flag] || 'false');
        if (typeof value === 'boolean') {
            return value;
        }
        if (['1', '0'].includes(value.toString())) {
            return !!value;
        }
        throw new Error(`Expected boolean value for environment flag '${flag}'`);
    } catch (error) {
        console.warn(
            `⚡  Environment flag '${flag}' is not a valid JSON value. Defaulting to '${defaultValue}'.`,
            error,
        );
        return defaultValue;
    }
}

export function envOverride<T extends keyof NodeJS.ProcessEnv>(key: T, defaultValue: NodeJS.ProcessEnv[T]) {
    const value = process.env[key];
    if (typeof value === 'undefined') {
        return defaultValue;
    }
    return value;
}