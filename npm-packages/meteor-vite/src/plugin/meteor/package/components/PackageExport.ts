import { Logger } from '@/utilities/server';
import pc from 'picocolors';
import PackageJSON from '../../../../../package.json';
import { PACKAGE_SCOPE_KEY, TEMPLATE_GLOBAL_KEY } from '../StubTemplate';
import MeteorPackage from './MeteorPackage';

export default class PackageExport {
    
    public readonly meteorPackage: MeteorPackage;
    public readonly packageName: string;
    public readonly key: string;
    
    constructor({ meteorPackage, key, packageName }: { meteorPackage: MeteorPackage, key: string, packageName: string }) {
        this.meteorPackage = meteorPackage;
        this.packageName = packageName;
        this.key = key;
        
        if (meteorPackage.name !== packageName) {
            Logger.warn(`Detected multiple package definitions within ${pc.yellow(this.meteorPackage.name)}! Please report this to ${PackageJSON.bugs.url}`)
            Logger.warn(`Package ${pc.red(packageName)} was defined within ${pc.yellow(meteorPackage.name)} 🤔`);
        }
    }
    
    public serialize() {
        return `export const ${this.key} = ${PACKAGE_SCOPE_KEY}.${this.key};`
    }
    
    public serializeImport() {
        return `const ${PACKAGE_SCOPE_KEY} = ${TEMPLATE_GLOBAL_KEY}.Package['${this.packageName}']`
    }
}