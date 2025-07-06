import { ModuleExportData } from '../../parser/Parser';
import type MeteorPackage from './MeteorPackage';
import ModuleExport from './ModuleExport';

export class PackageSubmodule {
    
    /**
     * Relative path from the package name to the module containing these exports.
     * @example
     * 'cookie-store.js'
     */
    public readonly modulePath: string;
    
    /**
     * ESM exports from the Meteor package module.
     * @example
     * export const foo = '...'
     */
    public readonly exports: ModuleExport[];
    
    /**
     * The Meteor package this submodule belongs to.
     * @type {MeteorPackage}
     */
    public readonly meteorPackage: MeteorPackage;
    
    public readonly isMainModule?: boolean;
    
    /**
     * Full import path for the package's requested module.
     * @example
     * 'meteor/ostrio:cookies/cookie-store.js'
     */
    public get fullImportPath() {
        if (this.isMainModule) {
            return this.meteorPackage.packageId;
        }
        return `${this.meteorPackage.packageId}${this.modulePath ? `/${this.modulePath}` : ''}`
    };
    
    constructor({ meteorPackage, modulePath, exports, isMainModule }: PackageSubmoduleOptions) {
        this.isMainModule = isMainModule;
        this.modulePath = modulePath;
        this.meteorPackage = meteorPackage;
        this.exports = exports.map((data) => new ModuleExport({ data, parentModule: this }));
    }
    
}

interface PackageSubmoduleOptions {
    /**
     * ESM exports from the Meteor package module.
     * @example
     * export const foo = '...'
     */
    exports: ModuleExportData[];
    
    /**
     * Path relative to the current package to the module containing the these exports.
     * @example
     * 'meteor/ddp' // -> ''
     * 'meteor/ostrio:cookies' // -> ''
     * 'meteor/ostrio:cookies/cookie-store.js' // -> 'cookie-store.js'
     */
    modulePath: string;
    
    /**
     * Instance of the Meteor package this submodule belongs to.
     */
    meteorPackage: MeteorPackage;
    
    isMainModule?: boolean;
}