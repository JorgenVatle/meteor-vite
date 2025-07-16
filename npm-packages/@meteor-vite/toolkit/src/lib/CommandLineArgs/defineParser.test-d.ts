import { defineParser } from '@/lib/CommandLineArgs/defineParser';
import { describe, expectTypeOf, it, test } from 'vitest';

describe('parser result', () => {
    const parse = defineParser({
        fields: {
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
        },
    });
    
    const result = parse();
    
    describe('primitives', () => {
        test('boolean', () => {
            expectTypeOf(result.boolean).toEqualTypeOf<boolean>()
        });
        
        test('strings', () => {
            expectTypeOf(result.string).toEqualTypeOf<string>()
        });
        
        test('optional strings', () => {
            expectTypeOf(result.optionalString).toEqualTypeOf<string | undefined>()
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
    })
    
    describe('arrays', () => {
        test('strings', () => {
            expectTypeOf(result.multipleStrings).toEqualTypeOf<string[]>()
        });
        
        test('optional strings', () => {
            expectTypeOf(result.multipleOptionalStrings).toEqualTypeOf<string[] | undefined>()
        })
    });
    
    describe('transforms', () => {
        it('can augment the result', () => {
            const parse = defineParser({
                fields: {
                    baseField: {
                        type: String,
                    },
                    fieldToAugment: {
                        type: String,
                    }
                },
                transform(result) {
                    return {
                        ...result,
                        extraField: 'foobar' as const,
                        fieldToAugment: [result.fieldToAugment, 'barfoo'] as const,
                    }
                }
            });
            
            const result = parse();
            
            expectTypeOf(result.extraField).toEqualTypeOf<'foobar'>()
            expectTypeOf(result.fieldToAugment).toEqualTypeOf<readonly [string, 'barfoo']>()
            expectTypeOf(result.fieldToAugment[0]).toEqualTypeOf<string>()
            expectTypeOf(result.fieldToAugment[1]).toEqualTypeOf<'barfoo'>()
        })
    })
})