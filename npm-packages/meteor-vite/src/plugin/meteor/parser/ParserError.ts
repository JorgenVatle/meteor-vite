import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { Node } from '@babel/types';
import { inspect } from 'util';
import { ParseOptions } from './Parser';

export class ParserError extends MeteorViteError {
    constructor(
        public originalMessage: string,
        public readonly metadata?: {
            parseOptions?: ParseOptions,
            node?: Node,
        },
    ) {
        super(originalMessage);
    }
    
    public async formatLog() {
        const { parseOptions, node } = await this.metadata || {};
        if (parseOptions?.fileContent) {
            this.addLine([
                `// File content for: ${this.metadata?.parseOptions?.filePath}`, '',
            ]);
            (await parseOptions.fileContent).split(/[\r\n]+/).forEach((line) => this.addLine(line));
        }
        if (node) {
            this.addLine([inspect(node)]);
        }
    }
}

export class ModuleExportsError extends ParserError {
    constructor(
        public readonly message: string,
        public readonly node: Node,
    ) {
        super(message, { node });
    }
}