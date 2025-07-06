import { describe, expect, test } from 'vitest';
import MeteorPackage from '../src/plugin/meteor/package/components/MeteorPackage';
import { PackageSubmodule } from '../src/plugin/meteor/package/components/PackageSubmodule';
import { TsModules } from './__mocks';

describe('MeteorPackage', () => {
    describe('Utility methods', () => {
        describe('get module exports from path', () => {
            
            test('without a file extension', async () => {
                const meteorPackage = await MeteorPackage.parse({
                    filePath: TsModules.filePath,
                    fileContent: TsModules.fileContent,
                });
                const file = meteorPackage.getModule({
                    importPath: '/explicit-relative-path'
                });
                const mockModule = new PackageSubmodule({
                    meteorPackage,
                    modulePath: 'explicit-relative-path.ts',
                    exports: TsModules.modules['explicit-relative-path.ts']
                })
                
                expect(file?.exports).toEqual(mockModule.exports)
                expect(file?.modulePath).toEqual('explicit-relative-path.ts');
            });
            
            test('with a file extension', async () => {
                const meteorPackage = await MeteorPackage.parse({
                    filePath: TsModules.filePath,
                    fileContent: TsModules.fileContent,
                });
                const file = meteorPackage.getModule({
                    importPath: '/explicit-relative-path'
                })
                const mockModule = new PackageSubmodule({
                    meteorPackage,
                    modulePath: 'explicit-relative-path.ts',
                    exports: TsModules.modules['explicit-relative-path.ts']
                })
                
                expect(file?.exports).toEqual(mockModule.exports);
                expect(file?.modulePath).toEqual('explicit-relative-path.ts');
            })
            
        })
    })
})