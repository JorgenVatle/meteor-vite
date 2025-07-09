import pc from 'picocolors';
import { createLogger } from './createLogger';

export const createLabelledLogger = (label: string) => createLogger((
    message: string,
    dataLines?: [key: string, value: string][] | Record<string, string>,
) => {
    if (!dataLines) {
        dataLines = [];
    }
    if (!Array.isArray(dataLines)) {
        dataLines = Object.entries(dataLines);
    }
    const data = dataLines.map(([key, value]) => {
        return `\n ${pc.dim('L')}  ${key}: ${value}`;
    }).join('');
    
    return [`${label} ${message}${data}`];
});

export type LabelLogger = ReturnType<typeof createLabelledLogger>