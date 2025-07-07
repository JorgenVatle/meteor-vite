import { ErrorMetadata, MeteorViteError } from '@/internals/error/MeteorViteError';
import ModuleExport from '@/plugin/meteor/components/ModuleExport';
import PackageExport from '@/plugin/meteor/components/PackageExport';
import { Logger } from '@/utilities/server';
import pc from 'picocolors';

/**
 * Utility class for soaking up and validating all import/export lines for a given module or package-scope export.
 * The properties here refer to the actual output within a stub.
 * Meaning, an "import" more takes the form of a reference to the global Package type.
 *
 * @example import
 * const ${PACKAGE_SCOPE_KEY} = ${TEMPLATE_GLOBAL_KEY}.Package['${this.packageName}']
 */
export class SerializationStore {
    /**
     * Collection of entries that serialize as a normal export.
     * @example input
     * export const foo = 'bar'
     * export { foo as bar } from './foo/bar'
     * export * as foobar from './foo/bar'
     *
     * @example output
     * export const foo = ${METEOR_STUB_KEY}.foo
     * export const bar = ${METEOR_STUB_KEY}.foo
     * export const foobar = ${METEOR_STUB_KEY}.foobar
     */
    protected exports = new Map<string, PackageExport | ModuleExport>;
    
    /**
     * Any export that cannot be serialized using a unique key
     * @example
     * export * from './foo/bar'
     */
    protected reExportWildcards = new Map<string, ModuleExport>;
    
    /**
     * Any named export that originates from another module.
     * @example
     * export * as FooBar from './foo/bar';
     */
    protected reExports = new Map<string, ModuleExport>;
    
    /**
     * Package imports. These do not serialize to ES imports, but rather references to the global Package type where
     * we will simulate a re-export from the given package.
     *
     * @example import
     * const ${PACKAGE_SCOPE_KEY} = ${TEMPLATE_GLOBAL_KEY}.Package['my:package']
     *
     * @example export
     * export const foo = ${PACKAGE_SCOPE_KEY}.foo
     */
    protected imports = new Map<string, PackageExport>();
    
    /**
     * Re-exports mapped by the path they are exporting from.
     *
     * @example source input
     * export { foo, bar } from 'meteor/foobar'
     * export * as Hello from 'meteor/hello'
     * @example map output
     * ['meteor/foobar', [ModuleExport, ModuleExport]]
     * ['meteor/hello', [ModuleExport]]
     */
    protected reExportsPathMap = new Map<string, ModuleExport[]>;
    
    constructor() {
    }
    
    protected addPackageExport(entry: PackageExport) {
        const existing = this.exports.get(entry.key);
        
        if (existing) {
            return Logger.debug(
                `Discarded submodule entry for package export as there already is an export for it`,
                { existing, entry },
            );
        }
        
        this.imports.set(entry.packageName, entry);
        this.exports.set(entry.key, entry);
    }
    
    public addEntry(entry: PackageExport | ModuleExport) {
        if (entry instanceof PackageExport) {
            return this.addPackageExport(entry);
        }
        
        if (entry.placement === 'none') {
            return;
        }
        
        if (entry.stubType === 'export-all') {
            this.reExportWildcards.set(entry.from!, entry);
            return;
        }
        
        this.validateNewKey(entry);
        
        if (entry.stubType === 're-export') {
            if (!entry.from) throw new ReExportWithoutPath('Detected a re-export entry without a "from" path!', { export: entry });
            const pathMap = this.reExportsPathMap.get(entry.from) || this.reExportsPathMap.set(entry.from, []).get(entry.from)!;
            this.reExports.set(entry.key, entry);
            pathMap.push(entry);
            return;
        }
        
        this.exports.set(entry.key, entry);
    }
    
    public validateNewKey(entry: ModuleExport): asserts entry is ModuleExport & { key: string } {
        if (!entry.key) {
            throw new MeteorViteError('Unable to determine type for module export!', { cause: entry });
        }
        
        const existing = this.exports.get(entry.key);
        const existingReExport = this.reExports.get(entry.key)
        
        if (existing instanceof ModuleExport) {
            throw new ConflictingExportKeys(
                `Duplicate module export detected in ${pc.yellow(entry.parentModule.meteorPackage.packageId)}!`,
                { conflict: { thisExport: entry, conflictedWith: existing } },
            );
        }
        if (existingReExport) {
            throw new ConflictingExportKeys(
                `Export key is conflicting with a module re-export in ${pc.yellow(entry.parentModule.meteorPackage.packageId)}!`,
                { conflict: { thisExport: entry, conflictedWith: existingReExport } },
            );
        }
    }
    
    public serialize() {
        const exports = new Set<string>;
        const reExports = new Set<string>;
        const imports = new Set<string>;
        
        this.reExportWildcards.forEach((entry) => reExports.add(entry.serialize()));
        this.reExportsPathMap.forEach((entry, path) => {
            const exportKeys = entry.map(entry => entry.serialize({ chainedReExport: true })).join(', ')
            return reExports.add(`export { ${exportKeys} } from '${path}';`);
        });
        
        this.imports.forEach((entry) => imports.add(entry.serializeImport()));
        this.exports.forEach((entry) => exports.add(entry.serialize()));
        
        return {
            imports: [...imports],
            reExports: [...reExports],
            exports: [...exports],
            exportKeys: [
                ...this.reExports.keys(),
                ...this.exports.keys()
            ],
        };
    }
}

export class ReExportWithoutPath extends MeteorViteError {
    constructor(message: string, meta: ErrorMetadata & { export: ModuleExport }) {
        super(message, meta);
        this.addSection('Offending export', meta.export);
    }
}

export class ConflictingExportKeys extends MeteorViteError {
    constructor(
        message: string,
        public readonly meta: ErrorMetadata & {
            conflict: {
                thisExport: ModuleExport | PackageExport
                conflictedWith: ModuleExport | PackageExport;
            }
        },
    ) {
        super(message, meta);
    }
    
    protected async formatLog() {
        const { thisExport, conflictedWith } = this.meta.conflict;
        this.addSection('Conflict', {
            exportKey: thisExport.key,
        });
        this.addSection('This export', thisExport);
        this.addSection('Conflicted with', conflictedWith);
    }
}