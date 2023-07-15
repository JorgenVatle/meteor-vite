import pc from 'picocolors';
import { ErrorMetadata, MeteorViteError } from '../../../vite/error/MeteorViteError';
import { PACKAGE_SCOPE_KEY, SerializedExports, TEMPLATE_GLOBAL_KEY } from '../StubTemplate';
import { PackageSubmodule } from './PackageSubmodule';
import { parseMeteorPackage } from '../parser/Parser';
import type { ModuleList, ParsedPackage, PackageScopeExports } from '../parser/Parser';
import { ConflictingExportKeys, isSameModulePath } from '../Serialize';

export default class MeteorPackage implements ParsedPackage {
    
    public readonly name: string;
    public readonly modules: ModuleList;
    public readonly mainModulePath?: string;
    public readonly packageScopeExports: PackageScopeExports;
    public readonly packageId: string;
    
    constructor(public readonly parsedPackage: ParsedPackage, public readonly meta: { timeSpent: string; }) {
        this.name = parsedPackage.name;
        this.modules = parsedPackage.modules;
        this.packageScopeExports = parsedPackage.packageScopeExports;
        this.mainModulePath = parsedPackage.mainModulePath;
        this.packageId = parsedPackage.packageId;
    }
    
    public static async parse(...options: Parameters<typeof parseMeteorPackage>) {
        const { result, timeSpent } = await parseMeteorPackage(...options);
        return new MeteorPackage(result, { timeSpent });
    }
    
    public getModule({ importPath }: { importPath?: string }): PackageSubmodule | undefined {
        if (!importPath) {
            return this.mainModule;
        }
        
        const entries = Object.entries(this.modules);
        const file = entries.find(
            ([fileName, modules]) => isSameModulePath({
                filepathA: importPath,
                filepathB: fileName,
                compareExtensions: false,
            }),
        );
        
        if (!file) {
            throw new MeteorPackageError(`Could not locate module for path: ${importPath}!`, this);
        }
        
        const [modulePath, exports] = file;
        
        return new PackageSubmodule({ modulePath, exports, meteorPackage: this });
    }
    
    public get mainModule(): PackageSubmodule | undefined {
        if (!this.mainModulePath) {
            return;
        }
        
        const [
            node_modules,
            meteor,
            packageName,
            ...filePath
        ] = this.mainModulePath.replace(/^\/+/g, '').split('/');
        
        const modulePath = filePath.join('/');
        const exports = this.modules[modulePath];
        
        if (!exports) {
            throw new MeteorPackageError(`Could not locate '${this.mainModulePath}' in package!`, this);
        }
        
        return new PackageSubmodule({
            meteorPackage: this,
            modulePath,
            exports,
        });
    }
    
    /**
     * Package-scope exports for the current package.
     * Serialized for use in the Meteor stub template.
     * {@link PackageScopeExports}
     */
    public serializeScopedExports(serialized: SerializedExports = {
        topLines: [],
        bottomLines: [],
        exportKeys: []
    }) {
        Object.entries(this.packageScopeExports).forEach(([packageName, exports]) => {
            if (serialized.exportKeys.includes(PACKAGE_SCOPE_KEY)) {
                throw new ConflictingExportKeys(`Detected package-scope key conflict with package scope key: ${PACKAGE_SCOPE_KEY} already exists in template`, {
                    conflict: {
                        key: PACKAGE_SCOPE_KEY,
                        moduleExports: [...serialized.topLines, ...serialized.bottomLines],
                        packageScope: this.packageScopeExports,
                    }
                });
            }
            serialized.topLines.push(`const ${PACKAGE_SCOPE_KEY} = ${TEMPLATE_GLOBAL_KEY}.Package['${packageName}']`);
            
            exports.forEach((exportKey) => {
                if (serialized.exportKeys.includes(exportKey)) {
                    throw new ConflictingExportKeys(`Detected module export key conflict for ${pc.yellow(exportKey)} in ${this.packageId}!`, {
                        conflict: {
                            key: exportKey,
                            packageScope: this.packageScopeExports,
                            moduleExports: [...serialized.topLines, ...serialized.bottomLines],
                        }
                    });
                }
                serialized.exportKeys.push(exportKey);
                serialized.bottomLines.push(`export const ${exportKey} = ${PACKAGE_SCOPE_KEY}.${exportKey};`)
            })
            
        });
        
        return serialized;
    }
    
    /**
     * Serialize package for the provided import path.
     * Converts all exports parsed for the package into an array of JavaScript import/export lines.
     */
    public serialize({ importPath }: { importPath?: string }): SerializedPackage {
        const result: SerializedExports = {
            topLines: [],
            bottomLines: [],
            exportKeys: [],
        }
        
        const submodule = this.getModule({ importPath });
        const exports = submodule?.serialize() || result;
        
        result.topLines.push(...exports.topLines);
        result.bottomLines.push(...exports.bottomLines);
        result.exportKeys.push(...exports.bottomLines);
        
        return {
            submodule,
            package: this,
            ...this.serializeScopedExports(result)
        };
    }
}

export interface SerializedPackage extends SerializedExports {
    package: MeteorPackage,
    submodule?: PackageSubmodule,
    importPath?: string;
}

class MeteorPackageError extends MeteorViteError {
    constructor(message: string, public readonly meteorPackage: MeteorPackage) {
        super(message, { package: meteorPackage });
    }
}