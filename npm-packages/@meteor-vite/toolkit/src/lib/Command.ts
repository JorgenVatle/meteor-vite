import { Parser } from '@/lib/CommandLineArgs/defineParser';
import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import type { Pretty, ResolveFieldInputTypes, ResolveFieldTypes } from '@/lib/CommandLineArgs/parseArgs';

export class Command<
    TName extends string,
    TFields extends Record<string, FieldConfig>,
    TOutput extends Pretty<ResolveFieldTypes<TFields>> = Pretty<ResolveFieldTypes<TFields>>,
    TInput extends Pretty<ResolveFieldInputTypes<TFields>> = Pretty<ResolveFieldInputTypes<TFields>>,
> {
    
    protected parser: Parser<TFields, TOutput, TInput>;
    
    constructor(
        protected readonly config: {
            name: TName,
            description: string;
            fields: TFields;
            handler: (args: TOutput) => Promise<void>;
        },
    ) {
        this.parser = new Parser(config.fields, {});
    }
    
    public run(input?: TInput) {
        return this.config.handler(this.parser.parse(input));
    }
}