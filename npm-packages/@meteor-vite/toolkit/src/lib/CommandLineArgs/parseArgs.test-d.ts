import { parseArgs } from '@/lib/CommandLineArgs/parseArgs';
import { describe, expectTypeOf, test } from 'vitest';

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
    
    describe('primitives', () => {
        test('boolean', () => {
            expectTypeOf(result.foo).toEqualTypeOf<boolean>()
        });
        
        test('strings', () => {
            expectTypeOf(result.bar).toEqualTypeOf<string>()
        });
        
        test('optional strings', () => {
            expectTypeOf(result.imOptional).toEqualTypeOf<string | undefined>()
        })
        
        test('numbers', () => {
            // todo
        })
    })
    
    describe('arrays', () => {
        test('strings', () => {
            expectTypeOf(result.multiple).toEqualTypeOf<string[]>()
        });
        
        test('optional strings', () => {
            expectTypeOf(result.multipleOptional).toEqualTypeOf<string[] | undefined>()
        })
        
        test('booleans', () => {
            // todo
        });
        
        test('numbers', () => {
            // todo
        });
    })
    
});
