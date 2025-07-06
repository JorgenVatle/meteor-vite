import Path from 'path';
import pc from 'picocolors';
import { MeteorViteError } from '../../../../error/MeteorViteError';
import Logger from '../../../../utilities/Logger';
import type { ModuleList, ParsedPackage } from '../../parser/Parser';
import { parseMeteorPackage } from '../../parser/Parser';
import { ConflictingExportKeys, SerializationStore } from '../SerializationStore';
import type ModuleExport from './ModuleExport';
import PackageExport from './PackageExport';
import { PackageSubmodule } from './PackageSubmodule';

interface MeteorPackageMetaOptions {
    timeSpent: string;
    ignoreDuplicateExportsInPackages?: string[],
    viteEnv?: string;
    lazyMainModulePath?: string;
}

export default class MeteorPackage implements Omit<ParsedPackage, 'packageScopeExports'> {
    
    public readonly name: string;
    public readonly modules: ModuleList;
    public readonly mainModulePath: string | null;
    public readonly lazyMainModulePath: string | null;
    public readonly packageScopeExports: PackageExport[] = [];
    public readonly packageId: string;
    
    constructor(public readonly parsedPackage: ParsedPackage, public readonly meta: MeteorPackageMetaOptions) {
        this.name = parsedPackage.name;
        this.modules = parsedPackage.modules;
        this.mainModulePath = parsedPackage.mainModulePath || null;
        this.lazyMainModulePath = meta.lazyMainModulePath || null;
        this.packageId = parsedPackage.packageId;
        
        Object.entries(parsedPackage.packageScopeExports).forEach(([packageName, exports]) => {
            exports.forEach((key) => {
                this.packageScopeExports.push(new PackageExport({
                    packageName,
                    meteorPackage: this,
                    key,
                }));
            });
        })
    }
    
    public toJson() {
        const { name, modules, mainModulePath, packageScopeExports, packageId } = this;
        return JSON.stringify({
            name,
            modules,
            packageScopeExports: packageScopeExports.map(({ packageName, key }) => ({ packageName, key })),
            packageId,
            mainModulePath,
            serialized: {
                mainModule: this.serialize({}),
            }
        }, null, 2);
    }
    
    /**
     * Mock template for the current package.
     * Used for quickly generating source files to use as tests in meteor-vite.
     */
    public toMock() {
        return [
            'import { prepareMock } from "@/test/lib"',
            `export default prepareMock(${this.toJson()})`,
        ].join('\n');
    }
    
    public static async parse(parse: Parameters<typeof parseMeteorPackage>[0], options?: Partial<MeteorPackageMetaOptions>) {
        const { result, timeSpent } = await parseMeteorPackage(parse);
        return new MeteorPackage(result, { timeSpent, ...options });
    }
    
    public getModule(module: { importPath?: string | null, _isMain?: boolean }): PackageSubmodule | undefined {
        const importPath = module.importPath?.replace(`/node_modules/${this.packageId}/`, '');
        
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
        
        if (file) {
            const [modulePath, exports] = file;
            
            return new PackageSubmodule({
                modulePath: modulePath,
                exports,
                meteorPackage: this,
                isMainModule: module._isMain,
            });
        }
        
        if (!importPath.startsWith('/node_modules/')) {
            throw new MeteorPackageError(`Could not locate module for path: ${importPath}!`, this);
        }
        
        if (!this.parsedPackage.node_modules) {
            throw new MeteorPackageError(`Unable to retrieve npm packages from Meteor module. (${importPath})`, this);
        }
        
        const moduleImport = importPath.replace('/node_modules/', '');
        const nodePackage = this.parsedPackage.node_modules.find(({ name }) => {
            if (!name) {
                return;
            }
            if (name === moduleImport) {
                return true;
            }
            if (moduleImport.split('/')[0] === name) {
                return true;
            }
            return false;
        });
        
        if (!nodePackage) {
            throw new MeteorPackageError(`Could not locate npm package: ${nodePackage} in ${this.name} (${importPath})`, this);
        }
        
        const meteorNodePackage = new MeteorPackage({ ...nodePackage, packageScopeExports: {} }, { timeSpent: 'none' });
        const childPackageImportPath = moduleImport.replace(nodePackage.name, '').replace(/^\//, '');
        return meteorNodePackage.getModule({ importPath: childPackageImportPath });
    }
    
    public get mainModule(): PackageSubmodule | undefined {
        const mainModulePath = this.mainModulePath || this.lazyMainModulePath;
        
        if (!mainModulePath) {
            return;
        }
        
        if (mainModulePath in this.modules && this.parsedPackage.type === 'npm') {
            return new PackageSubmodule({
                meteorPackage: this,
                modulePath: mainModulePath,
                exports: this.modules[mainModulePath]
            })
        }
        
        return this.getModule({
            importPath: mainModulePath,
            _isMain: true,
        });
    }
    
    
    /**
     * Converts all exports parsed for the package into an array of JavaScript stub-related import/export lines.
     */
    public serialize(config: { importPath?: string }) {
        const importPath = config.importPath;
        
        const store = new SerializationStore();
        let submodule = this.mainModule;
        
        if (importPath) {
            submodule = this.getModule({ importPath });
        }
        
        const addEntry = (entry: ModuleExport | PackageExport) => {
            try {
                store.addEntry(entry);
            } catch (error) {
                if (error instanceof ConflictingExportKeys) {
                    if (this.meta?.ignoreDuplicateExportsInPackages?.includes(submodule?.meteorPackage.packageId!)) {
                        return;
                    }
                }
                Logger.warn(error);
            }
        }
        
        // Package exports are only available at the package's mainModule, so if an import path is provided,
        // we want to omit any of these exports and only use the module-specific exports
        if (!importPath) {
            this.packageScopeExports.forEach((entry) => addEntry(entry));
        }
        
        submodule?.exports.forEach((entry) => {
            if (!importPath?.includes('node_modules')) {
                addEntry(entry);
                return;
            }
            
            if (entry.type !== 're-export' || entry.name !== '*') {
                addEntry(entry);
                return;
            }
            
            /** Flatten re-exports for relative modules.
             * @example root module
             * // index.js
             * export * from './cjs/react.production.min.js'
             *
             * @example stub output
             * export const useState = ...
             * export const createContext = ...
             */
            try {
                const module = submodule.meteorPackage.getModule({
                    // Todo extract path rewrites like this to a reusable method
                    importPath: entry.from?.replace('./', '')
                });
                module!.exports.forEach((entry) => {
                    addEntry(entry)
                });
            } catch (error) {
                Logger.warn(error);
            }
        });
        
        return store.serialize();
    }
}

/**
 * Check if the two provided module paths are the same.
 * Todo: this may end up causing issues if a package has say a "myModule.ts" and a "myModule.ts" file.
 */
const REGEX_LEADING_SLASH = /^\/+/;

export function isSameModulePath(options: {
    filepathA: string,
    filepathB: string,
    compareExtensions: boolean;
}) {
    const fileA = Path.parse(options.filepathA.replace(REGEX_LEADING_SLASH, ''));
    const fileB = Path.parse(options.filepathB.replace(REGEX_LEADING_SLASH, ''));
    
    if (fileA.dir !== fileB.dir) {
        return false;
    }
    
    if (options.compareExtensions && fileA.ext !== fileB.ext) {
        return false;
    }
    
    return fileA.name === fileB.name;
}

class MeteorPackageError extends MeteorViteError {
    constructor(message: string, public readonly meteorPackage: MeteorPackage) {
        super(message + ` (${pc.yellow(meteorPackage.meta.viteEnv || 'common')})`, { package: meteorPackage });
    }
}