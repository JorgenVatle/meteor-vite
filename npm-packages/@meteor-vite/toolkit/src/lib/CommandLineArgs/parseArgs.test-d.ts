import { parseArgs } from '@/lib/CommandLineArgs/parseArgs';
import { describe, expectTypeOf, it, test } from 'vitest';

describe('result type', () => {
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
    });
    
    describe('mismatched types emit errors', () => {
        test('booleans', () => {
            expectTypeOf(result.foo).not.toEqualTypeOf<number>()
        })
        test('strings', () => {
            expectTypeOf(result.bar).not.toEqualTypeOf<number>()
        })
        test('optional strings', () => {
            expectTypeOf(result.imOptional).not.toEqualTypeOf<number>()
            expectTypeOf(result.imOptional).not.toEqualTypeOf<string>()
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

describe('default values', () => {
    it('will allow defaults matching the underlying primitive type', () => {
        parseArgs({
            foo: {
                type: Boolean,
                defaultValue: true,
            }
        })
    })
    
    it('will not allow defaults that do not match the underlying primitive type', () => {
        parseArgs({
            foo: {
                type: Boolean,
                // @ts-expect-error
                defaultValue: '123',
            }
        })
    })
})