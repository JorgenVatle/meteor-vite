import type { FieldConfig, InferFieldType } from '@/lib/CommandLineArgs/Field';
import { parse, type ParseOptions } from 'ts-command-line-args';

export function parseArgs<
    TFields extends Record<string, FieldConfig>,
    TResult extends {
        [key in keyof TFields]: InferFieldType<TFields[key]>;
    },
    TDefaults extends {
        [key in keyof TResult]?: TResult[key];
    }
>(
    fields: {
        [key in keyof TFields]: FieldConfig<TFields[key]>;
    },
    options: ParseOptions<TResult> & { defaults?: TDefaults } = {},
): TResult {
    const args: Record<string, unknown> = {
        ...fields,
    }
    
    Object.entries(options.defaults || {}).forEach(([key, value]) => {
        args[key] = {
            defaultValue: value,
        }
    })
    
    return parse(args as any, options);
}
