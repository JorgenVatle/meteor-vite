import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import {
    parseArgs,
    type ParserOptions,
    type Pretty,
    type ResolveFieldInputTypes,
    type ResolveFieldTypes,
} from '@/lib/CommandLineArgs/parseArgs';

export function defineParser<
    TFields extends Record<string, FieldConfig>,
    TResolvedFields extends ResolveFieldTypes<TFields>,
    TInputType extends Pretty<ResolveFieldInputTypes<TFields>>,
    TDefaults extends Partial<TResolvedFields> = {},
    TResult = ResolveFieldTypes<TFields>,
>({ options, defaults, transform, fields }: {
    fields: TFields;
    defaults?: TDefaults;
    options?: ParserOptions<TResolvedFields>;
    transform?: (fields: Pretty<TResolvedFields>) => TResult;
}): DefinedParser<TInputType, Pretty<TResult>> {
    
    function parse(): TResult {
        const parsed: any = parseArgs(fields, Object.assign({ defaults }, options));
        
        if (transform) {
            return transform(parsed);
        }
        
        return parsed;
    }
    
    type IOTypes = DefinedParser<TInputType, TResult>;
    
    return parse as IOTypes;
}


interface DefinedParser<TInput, TResult> {
    '_inputType': TInput;
    '_outputType': TResult;
    (): TResult;
}