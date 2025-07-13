import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import {
    parseArgs,
    type ParserOptions,
    type ResolveFieldInputTypes,
    type ResolveFieldTypes,
} from '@/lib/CommandLineArgs/parseArgs';

export class Parser<
    TFields extends Record<string, FieldConfig>,
    TOutput extends ResolveFieldTypes<TFields>,
    TInput = ResolveFieldInputTypes<TFields>,
    TDefaults extends Partial<TOutput> = {},
    TTransform = TOutput,
> {
    declare _inputType: TInput;
    declare _outputType: TOutput;
    
    constructor(
        protected readonly fields: TFields,
        protected readonly options: ParserOptions<TOutput, TDefaults> & {
            transform?: (output: TOutput) => TTransform;
        } = {}
    ) {
        this.options = options;
    }
    
    public parse(input?: TInput): TOutput {
        const defaults = {
            ...this.options.defaults,
            ...input,
        };
        return parseArgs(this.fields, {
            ...this.options,
            defaults,
        });
    }
    
    public transform(input?: TInput): TTransform {
        const output = this.parse(input);
        if (!this.options.transform) {
            return output as any;
        }
        return this.options.transform(output);
    }
}
