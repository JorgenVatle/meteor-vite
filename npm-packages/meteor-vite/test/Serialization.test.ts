import { describe, expect, it } from 'vitest';
import MeteorPackage from '../src/plugin/meteor/package/components/MeteorPackage';
import ModuleExport from '../src/plugin/meteor/package/components/ModuleExport';

describe('Serialization', () => {
    const meteorPackage = new MeteorPackage({
        name: 'empty:package',
        packageId: 'meteor/empty:package',
        packageScopeExports: {},
        modules: {
            'index.ts': []
        },
        mainModulePath: '',
    }, { timeSpent: 'none' });
    const submodule = meteorPackage.getModule({ importPath: 'index.ts' });
    
    describe('ModuleExport', () => {
        /**
         * If E.g. `meteor/foo:bar` has `export * as otherExports from './exports.js'`
         * We do not need to add a re-export line at the top of the template
         * (`export * as otherExports from 'meteor/foo:bar/exports.js`)
         * We just need to reference the stub's package import.
         *
         * @example mainModule for 'meteor/foo:bar'
         * export * as otherExports from './exports.js'
         *
         * @example efficient stub template ✅
         * export const otherExports = ${STUB_TEMPLATE_KEY}.otherExports
         *
         * @example inefficient stub template ❌
         * export * as otherExports from 'meteor/foo:bar/exports.js'
         */
        it('it does not re-export properties already re-exported by the current submodule', () => {
            const exportEntry = new ModuleExport({
                parentModule: submodule!,
                data: {
                    type: 're-export',
                    name: 'ReExportFromRelative',
                    from: './relative'
                }
            });
            
            expect(exportEntry.isReExportedByParent, 'is re-exported by parent').toBe(true);
            expect(exportEntry.serialize(), 'serialized output').not.toContain(exportEntry.exportPath);
        });
        
        it('will re-export relative modules if they are exported using a wildcard key', () => {
            const exportEntry = new ModuleExport({
                parentModule: submodule!,
                data: {
                    type: 're-export',
                    from: './otherExports',
                    name: '*',
                }
            });
            const serialized = exportEntry.serialize();
            
            expect(serialized).toContain(`export`);
            expect(serialized).toContain(`*`);
            expect(serialized).toContain(`from`);
            expect(serialized).not.toContain(`as`);
            expect(serialized).toContain(`/otherExports`);
        })
    })
})