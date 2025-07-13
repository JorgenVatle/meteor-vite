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
    options: ParserOptions<TResult> & { defaults?: TDefaults } = {},
): TResult {
    const args: Record<string, unknown> = {
        ...fields,
    }
    
    Object.entries(options.defaults || {}).forEach(([key, value]) => {
        args[key] = {
            defaultValue: value,
        }
    })
    
    return TSCliArgs.parse(args as any, options);
}

export type ResolveFieldTypes<TFields extends Record<string, FieldConfig>> = {
    [key in keyof TFields]: InferFieldType<TFields[key]>;
}

export type ParserOptions<TFields> = TSCliArgs.ParseOptions<TFields>;