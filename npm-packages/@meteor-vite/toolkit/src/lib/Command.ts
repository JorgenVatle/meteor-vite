import { Parser } from '@/lib/CommandLineArgs/defineParser';
import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import type { Pretty, ResolveFieldInputTypes, ResolveFieldTypes } from '@/lib/CommandLineArgs/parseArgs';

export class Command<
    TName extends string = string,
    TFields extends Record<string, FieldConfig> = {},
    TOutput extends Pretty<ResolveFieldTypes<TFields>> = Pretty<ResolveFieldTypes<TFields>>,
    TInput extends Pretty<ResolveFieldInputTypes<TFields>> = Pretty<ResolveFieldInputTypes<TFields>>,
> {
    
    protected parser: Parser<TFields, TOutput, TInput>;
    
    constructor(
        public readonly name: TName,
        protected readonly config: {
            description: string;
            fields: TFields;
            handler: (args: TOutput) => Promise<void>;
        },
    ) {
        this.parser = new Parser(config.fields, {});
    }
    
    public run(options?: typeof this.parser.options) {
        return this.config.handler(this.parser.parse(options));
    }
}

export type CommandSpec = {
    name: string;
    run: (args: any) => Promise<void>;
}