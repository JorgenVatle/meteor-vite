import { Parser, type ParserInstanceOptions } from '@/lib/CommandLineArgs/defineParser';
import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import type { Pretty, ResolveFieldTypes } from '@/lib/CommandLineArgs/parseArgs';

export class CommandDefinition<
    TName extends string = string,
    TFields extends Record<string, FieldConfig> = {},
    TOutput extends Pretty<ResolveFieldTypes<TFields>> = Pretty<ResolveFieldTypes<TFields>>,
> implements CommandSpec {
    
    protected parser: Parser<TFields & typeof CommandDefinition.defaultFields, TOutput>;
    
    constructor(
        public readonly name: TName,
        public readonly config: {
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
    
    public async run(args: string[] = [], options?: typeof this.parser.options) {
        try {
            return await this.config.handler(
                this.parser.parse({
                    ...options,
                    argv: args,
                })
            );
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
    run: (args: string[], options?: ParserInstanceOptions<{}>) => Promise<void>;
    config: {
        title?: string;
        description: string;
    }
}