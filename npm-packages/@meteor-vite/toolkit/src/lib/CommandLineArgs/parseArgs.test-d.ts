import { parseArgs } from '@/lib/CommandLineArgs/parseArgs';
import { describe, expectTypeOf, it, test } from 'vitest';

describe('result type', () => {
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
        },
        defaultString: {
            defaultValue: 'foobar',
        }
    })
    
    describe('primitives', () => {
        test('boolean', () => {
            expectTypeOf(result.boolean).toEqualTypeOf<boolean>()
        });
        
        test('strings', () => {
            expectTypeOf(result.string).toEqualTypeOf<string>()
        });
        
        test('optional strings', () => {
            expectTypeOf(result.optionalString).toEqualTypeOf<string | undefined>()
        });
        
        test('default string', () => {
            expectTypeOf(result.defaultString).toEqualTypeOf<string>();
        })
        
        test('numbers', () => {
            // todo
        })
    });
    
    describe('mismatched types emit errors', () => {
        test('booleans', () => {
            expectTypeOf(result.boolean).not.toEqualTypeOf<number>()
        })
        test('strings', () => {
            expectTypeOf(result.string).not.toEqualTypeOf<number>()
        })
        test('optional strings', () => {
            expectTypeOf(result.optionalString).not.toEqualTypeOf<number>()
            expectTypeOf(result.optionalString).not.toEqualTypeOf<string>()
        })
        test('numbers', () => {
            // todo
        })
    })
    
    describe('arrays', () => {
        test('strings', () => {
            expectTypeOf(result.multipleStrings).toEqualTypeOf<string[]>()
        });
        
        test('optional strings', () => {
            expectTypeOf(result.multipleOptionalStrings).toEqualTypeOf<string[] | undefined>()
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
            },
            bar: {
                type: Number,
            }
        }, {
            defaults: {
                foo: true,
                bar: 123,
            }
        })
    })
    
    it('will not allow defaults that do not match the underlying primitive type', () => {
        parseArgs({
            foo: {
                type: Boolean,
            }
        }, {
            defaults: {
                // @ts-expect-error
                foo: '123',
            }
        })
    })
})