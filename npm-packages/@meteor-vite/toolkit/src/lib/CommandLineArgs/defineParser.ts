import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import { parseArgs, type ParserOptions, type Pretty, type ResolveFieldTypes } from '@/lib/CommandLineArgs/parseArgs';

export function defineParser<
    TFields extends Record<string, FieldConfig>,
    TResolvedFields extends ResolveFieldTypes<TFields>,
    TDefaults extends Partial<TResolvedFields> = {},
    TResult = ResolveFieldTypes<TFields>
>({ options, defaults, transform, fields }: {
    fields: TFields;
    defaults?: TDefaults;
    options?: ParserOptions<TResolvedFields>;
    transform?: (fields: Pretty<TResolvedFields>) => TResult;
}): DefinedParser<Pretty<TResolvedFields>, Pretty<TResult>> {
    
    function parse(): TResult {
        const parsed: any = parseArgs(fields, Object.assign({ defaults }, options));
        
        if (transform) {
            return transform(parsed);
        }
        
        return parsed;
    }
    
    type IOTypes = DefinedParser<TResolvedFields, TResult>;
    
    return parse as IOTypes;
}


interface DefinedParser<TFields, TResult> {
    '_inputType': TFields;
    '_outputType': TResult;
    (): TResult;
}