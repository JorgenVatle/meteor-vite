import type { FieldConfig, GenericField, InferFieldType } from '@/lib/CommandLineArgs/Field';
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
    const args: Record<string, GenericField> = {
        ...fields,
    }
    
    Object.entries(options.defaults || {}).forEach(([key, value]) => {
        args[key] = Object.assign({
            defaultValue: value,
        }, args[key]);
    });
    
    Object.entries(args).forEach(([key, field]) => {
        if (!('defaultValue' in field)) {
            return;
        }
        
        // Mark fields where a default has been assigned as optional.
        if (typeof field.optional !== 'boolean' && field.defaultValue) {
            field.optional = true;
        }
        
        // Assign a primitive factory function for fields without an explicitly defined type
        if (!('type' in field)) {
            field.type = getPrimitiveConstructor(field.defaultValue);
        }
        
        // Ensure custom type transform functions also gets applied to default values.
        if (typeof field.type === 'function') {
            field.defaultValue = field.type(field.defaultValue);
        }
        
    })
    
    return TSCliArgs.parse(args as any, options);
}

function getPrimitiveConstructor(value: any): { (value?: any): any } | undefined {
    if (typeof value === 'undefined') {
        return;
    }
    if (value === null) {
        return;
    }
    return value.constructor;
}

export type ResolveFieldTypes<TFields extends Record<string, FieldConfig>> = {
    [key in keyof TFields]: InferFieldType<TFields[key]>;
} & { _unknown: any[] }

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