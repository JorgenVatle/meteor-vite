import { parseArgs } from '@/lib/CommandLineArgs/parseArgs';
import { describe, expectTypeOf, it } from 'vitest';

describe('primitive type parsing', () => {
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
    
    it('will infer boolean types', () => {
        expectTypeOf(result.foo).toEqualTypeOf<boolean>()
    })
    
    it('will infer string types', () => {
        expectTypeOf(result.bar).toEqualTypeOf<string>()
    })
    
    it('will infer optional string types', () => {
        expectTypeOf(result.imOptional).toEqualTypeOf<string | undefined>()
    })
    
    it('will infer array types', () => {
        expectTypeOf(result.multiple).toEqualTypeOf<string[]>()
    })
    
    it('will infer optional array types', () => {
        expectTypeOf(result.multipleOptional).toEqualTypeOf<string[] | undefined>()
    })
})