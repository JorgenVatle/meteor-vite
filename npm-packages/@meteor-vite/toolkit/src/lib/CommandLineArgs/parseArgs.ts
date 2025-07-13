import type { FieldConfig, InferFieldType } from '@/lib/CommandLineArgs/Field';
import { parse, type ParseOptions } from 'ts-command-line-args';

export function parseArgs<
    TFields extends Record<string, FieldConfig>,
    TResult extends {
        [key in keyof TFields]: InferFieldType<TFields[key]>;
    }
>(
    fields: {
        [key in keyof TFields]: FieldConfig<TFields[key]>;
    },
    options: ParseOptions<TResult> = {}
): TResult {
    return parse(fields as any, options);
}

const result = parseArgs({
    boolean: {
        type: Boolean,
    },
    string: {
        type: String,
    },
    optionalString: {
        type: String,
        optional: true,
    },
    multipleStrings: {
        type: String,
        multiple: true,
    },
    multipleOptionalStrings: {
        type: String,
        multiple: true,
        optional: true,
    }
})
