import type { FieldConfig, InferFieldType } from '@/lib/CommandLineArgs/Field';
import * as TSCliArgs from 'ts-command-line-args';

export function parseArgs<
    TFields extends Record<string, FieldConfig>,
    TResult extends ResolveFieldTypes<TFields>,
    TDefaults extends {
        [key in keyof TResult]?: TResult[key];
    }
>(
    fields: {
        [key in keyof TFields]: FieldConfig<TFields[key]>;
    },
    options: ParserOptions<TResult, TDefaults> = {},
): TResult {
    const args: Record<string, { type?: any; defaultValue?: any } & FieldConfig> = {
        ...fields,
    }
    
    Object.entries(options.defaults || {}).forEach(([key, value]) => {
        args[key] = Object.assign({
            defaultValue: value,
        }, args[key]);
    })
    Object.entries(args).forEach(([key, field]) => {
        if (field.type) {
            return;
        }
        if (typeof field.defaultValue !== 'undefined') {
            return field.type = field.defaultValue.constructor;
        }
    })
    
    return TSCliArgs.parse(args as any, options);
}

export type ResolveFieldTypes<TFields extends Record<string, FieldConfig>> = {
    [key in keyof TFields]: InferFieldType<TFields[key]>;
}

export type ResolveFieldInputTypes<
    TFields extends Record<string, FieldConfig>,
    TDefaults extends keyof TFields = {
        [key in keyof TFields]-?: TFields[key] extends { defaultValue: infer T }
                                 ? key
                                 : never;
    }[keyof TFields],
> = {
    [key in TDefaults]?: InferFieldType<TFields[key]>;
} & {
    [key in Exclude<keyof TFields, TDefaults>]: InferFieldType<TFields[key]>;
}

export type Pretty<T> = {
    [key in keyof T]: T[key]
} & {}

export type ParserOptions<
    TFields,
    TDefaults = Partial<TFields>
> = TSCliArgs.ParseOptions<TFields> & {
    defaults?: TDefaults
};