import pc from 'picocolors';

export const Highlight = {
    fileType: pc.blue,
    filePath: pc.yellow,
    binary: pc.cyan,
    command(command: string, params: string[] = []) {
        return this.binary([
            pc.dim(`$`),
            'toolkit',
            pc.bold(command),
            params
        ].flat().join(' '));
    }
} as const;