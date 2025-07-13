import { Parser } from '@/lib/CommandLineArgs/defineParser';
import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import type { Pretty, ResolveFieldTypes } from '@/lib/CommandLineArgs/parseArgs';

export class CommandDefinition<
    TName extends string = string,
    TFields extends Record<string, FieldConfig> = {},
    TOutput extends Pretty<ResolveFieldTypes<TFields>> = Pretty<ResolveFieldTypes<TFields>>,
> {
    
    protected parser: Parser<TFields & typeof CommandDefinition.defaultFields, TOutput>;
    
    constructor(
        public readonly name: TName,
        protected readonly config: {
            title?: string;
            description: string;
            fields: TFields;
            handler: (args: TOutput) => Promise<void>;
        },
    ) {
        this.parser = new Parser({
            ...config.fields,
            ...CommandDefinition.defaultFields
        });
        
        this.parser.setHelpContent({
            title: config.title || this.name,
            description: config.description,
        });
    }
    
    protected static defaultFields: Record<string, FieldConfig> = {
        help: {
            type: Boolean,
            alias: 'h',
            description: 'Show help',
            defaultValue: false,
        }
    };
    
    public run(options?: typeof this.parser.options) {
        try {
            return this.config.handler(this.parser.parse(options));
        } catch (error) {
            if (!(error instanceof Error)) {
                throw error;
            }
            if (error.name === 'UNKNOWN_VALUE') {
                this.parser.printHelp();
            }
            throw error;
        }
    }
}

export type CommandSpec = {
    name: string;
    run: (args: any) => Promise<void>;
    config: {
        title?: string;
        description: string;
    }
}