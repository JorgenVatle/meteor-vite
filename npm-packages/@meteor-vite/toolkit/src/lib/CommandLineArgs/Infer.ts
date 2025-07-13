import type { BaseField, Field, MultiField, OptionalField, OptionalMultiField } from '@/lib/CommandLineArgs/Field';
import { parse, type ParseOptions } from 'ts-command-line-args';

export function parseArgs<TFields extends Record<string, Field>, TResult extends {
    [key in keyof TFields]: InferFieldType<TFields[key]>;
}>(
    fields: TFields,
    options: ParseOptions<TResult> = {}
): TResult {
    return parse(fields as any, options);
}

type InferFieldType<
    TField,
> = TField extends OptionalMultiField<infer T>
    ? T[] | undefined
    : TField extends OptionalField<infer T>
      ? T | undefined
    : TField extends MultiField<infer T>
      ? T[]
      : TField extends BaseField<infer T>
        ? T
      : never;

const result = parseArgs({
    foo: {
        type: Boolean,
    },
    bar: {
        type: String,
    },
    imOptional: {
        type: String,
        optional: true,
    },
    multiple: {
        type: String,
        multiple: true,
    },
    multipleOptional: {
        type: String,
        multiple: true,
        optional: true,
    }
})
