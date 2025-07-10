import pc from 'picocolors';

export const Highlight = {
    fileType: pc.cyan,
    filePath: pc.yellow,
    binary: pc.blue,
    command(command: string, params: string[] = []) {
        const base = pc.dim(`$ ${this.binary('toolkit')}`);
        
        return `${base} ${this.binary(command)} ${params.join(' ')}`
    }
} as const;