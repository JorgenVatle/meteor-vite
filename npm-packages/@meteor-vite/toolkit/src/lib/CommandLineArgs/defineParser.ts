import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import {
    parseArgs,
    type ParserOptions,
    type Pretty,
    type ResolveFieldInputTypes,
    type ResolveFieldTypes,
} from '@/lib/CommandLineArgs/parseArgs';

export class Parser<
    TFields extends Record<string, FieldConfig> = Record<string, FieldConfig>,
    TOutput extends Pretty<ResolveFieldTypes<TFields>> = Pretty<ResolveFieldTypes<TFields>>,
    TInput extends Pretty<ResolveFieldInputTypes<TFields>> = Pretty<ResolveFieldInputTypes<TFields>>,
    TDefaults extends Partial<TOutput> = {},
    TOptions extends ParserOptions<TOutput, TDefaults> = ParserOptions<TOutput, TDefaults>,
    TTransform = TOutput,
> {
    declare _inputType: Pretty<TInput>;
    declare _outputType: Pretty<TOutput>;
    
    constructor(
        public readonly fields: TFields,
        protected readonly options?: TOptions & {
            transform?: (output: TOutput) => TTransform;
        }
    ) {
        this.options = options;
    }
    
    public parse(options?: TOptions): TOutput {
        const defaults = {
            ...this.options?.defaults,
            ...options?.defaults,
        };
        return parseArgs(this.fields, {
            ...this.options,
            ...options,
            // @ts-expect-error
            defaults,
        });
    }
    
    public transform(options?: TOptions): TTransform {
        const output = this.parse(options);
        if (!this.options?.transform) {
            return output as any;
        }
        return this.options.transform(output);
    }
}
