import MeteorPackage from '@/plugin/meteor/components/MeteorPackage';
import { METEOR_STUB_KEY, PACKAGE_SCOPE_KEY, stubTemplate } from '@/plugin/meteor/StubTemplate';
import { describe, expect, it } from 'vitest';

describe('StubTemplate', () => {
    const meteorPackage = new MeteorPackage({
        packageId: 'meteor/exampleuser:foobar',
        name: 'exampleuser:foobar',
        packageScopeExports: {},
        mainModulePath: '',
        modules: {
            'defaultExport.js': [
                { type: 'export-default', name: 'default' }
            ]
        }
    }, {
        timeSpent: 'none',
    });
    
    it('can create default export templates', () => {
        const template = stubTemplate({
            requestId: '',
            meteorPackage,
            importPath: 'defaultExport.js',
        });
        
        expect(template).toContain(`export default ${METEOR_STUB_KEY}.default`)
    });
    
    it(`does not create a package scope export key if it isn't necessary`, () => {
        const template = stubTemplate({
            requestId: '',
            meteorPackage,
            importPath: 'defaultExport.js',
        });
        expect(template).not.toContain(`const ${PACKAGE_SCOPE_KEY}`);
        expect(template).not.toContain(`${PACKAGE_SCOPE_KEY}.Package`);
    })
    
    it('can create package-scope export templates', () => {
        const meteorPackage = new MeteorPackage({
            packageId: 'meteor/exampleuser:foobar',
            name: 'exampleuser:foobar',
            packageScopeExports: {
                'exampleuser:foobar': ['packageScopeExport']
            },
            mainModulePath: '',
            modules: {}
        }, {
            timeSpent: 'none',
        });
        const template = stubTemplate({
            requestId: '',
            meteorPackage,
        });
        
        expect(template).toContain(`export const packageScopeExport`);
        expect(template).toContain(`Package['exampleuser:foobar']`);
        expect(template).not.toContain('export default');
    });
    
})