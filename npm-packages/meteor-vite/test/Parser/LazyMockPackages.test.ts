import { describe, expect, it } from 'vitest';
import { parseMeteorPackage } from '../../src/plugin/meteor/parser/Parser';
import { LazyLoadedPackage } from '../__mocks';

describe('Lazy-loaded packages', () => {
    describe('before being auto-imported', async () => {
        Object.entries(LazyLoadedPackage.packages).forEach(([key, lazyMock]) => {
            describe(lazyMock.packageName, async () => {
                const { result: parserResult } = await parseMeteorPackage(lazyMock);
                
                it('parsed the package name', () => {
                    expect(parserResult.name).toEqual(lazyMock.packageName);
                })
            })
        })
    })
})