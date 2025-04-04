import { is, isObjectExpression, Node, traverse, VariableDeclarator } from '@babel/types';
import { PackageModule } from './PackageModule';
import { ModuleList, propParser } from './Parser';
import { ModuleExportsError } from './ParserError';
import { MeteorInstallCallExpression, MeteorInstallMeteorProperty, MeteorPackageProperty } from './ParserTypes';

/**
 * Parser for a build Meteor package's meteorInstall() call.
 * Traverses through all the entries in the passed object to build up a map of each file exposed by the package
 * as well as tracking exports (module.export, module.exportDefault) and re-exports (module.link).
 * {@link https://github.com/JorgenVatle/meteor-vite/blob/8b0a7a5f5f95d78661793e8b4bc7f266c1081ed9/npm-packages/meteor-vite/test/__mocks/meteor-bundle/rdb_svelte-meteor-data.js#L25 example of meteorInstall() }
 */
export class MeteorInstall {
    public readonly modules: ModuleList = {};
    public readonly type: 'atmosphere' | 'npm';
    public packageId: string;
    public name: string;
    public mainModulePath?: string;
    public packageJson?: {
        name: string,
        version: string,
        main: string,
    }
    
    constructor({ packageId, name, type }: Pick<MeteorInstall, 'packageId' | 'name' | 'type'>) {
        this.packageId = packageId;
        this.name = name;
        this.type = type;
    }
    
    public static parse(node: Node) {
        const atmosphere = this.parseAtmosphereInstall(node);
        const npm = this.parseNpmInstall(node);
        
        return { npm, atmosphere };
    }
    
    protected static parseInstall(node: MeteorInstallCallExpression) {
        const [modules, fileExtensions] = node.arguments;
        const node_modules = modules.properties[0];
        if (propParser.getKey(node_modules) !== 'node_modules') {
            return {
                type: 'unknown',
            };
        }
        const meteor = node_modules.value.properties[0];
        if (propParser.getKey(meteor) === 'meteor') {
            return {
                type: 'atmosphere',
                meteor: meteor as MeteorInstallMeteorProperty,
            };
        }
        return {
            type: 'npm',
            node_modules,
        };
    }
    
    protected static parseAtmosphereInstall(node: Node) {
        if (!this.isRequireDeclaration(node)) return;
        if (!this.isMeteorInstall(node.init)) return;
        
        
        const { meteor, type } = this.parseInstall(node.init);
        if (type !== 'atmosphere' || !meteor) {
            return;
        }
        
        const packageName = meteor.value.properties[0];
        const packageModules = packageName.value.properties;
        
        const meteorPackage = new this({
            packageId: `${propParser.getKey(meteor)}/${propParser.getKey(packageName)}`,
            name: propParser.getKey(packageName),
            type: 'atmosphere',
        });
        
        meteorPackage.traverseModules(packageModules, '');
        
        return meteorPackage;
    }
    
    protected static parseNpmInstall(node: Node) {
        if (!this.isMeteorInstall(node)) return;
        
        const { node_modules, type } = this.parseInstall(node);
        const npmPackages = [];
        
        if (type !== 'npm' || !node_modules) return;
        
        for (const directory of node_modules.value.properties) {
            if (!isObjectExpression(directory.value)) return; // Not a directory
            const npmPackage = new this({
                type: 'npm',
                packageId: `${propParser.getKey(directory)}`,
                name: '',
            });
            npmPackage.traverseModules(directory.value.properties as MeteorPackageProperty[], '');
            npmPackages.push(npmPackage);
        }
        
        return npmPackages;
    }
    
    protected static isRequireDeclaration(node: Node): node is VariableDeclarator {
        if (node.type !== 'VariableDeclarator') return false;
        if (node.id.type !== 'Identifier') return false;
        if (node.id.name !== 'require') return false;
        
        return true;
    }
    
    protected static isMeteorInstall(expression?: Node | null): expression is MeteorInstallCallExpression {
        if (!expression) return false;
        if (expression.type !== 'CallExpression') return false;
        if (!is('Identifier', expression.callee, { name: 'meteorInstall' })) return false;
        
        return true;
    }
    
    public traverseModules(properties: MeteorPackageProperty[], parentPath: string) {
        properties.forEach((property) => {
            const name = propParser.getKey(property);
            const path = `${parentPath}${name}`;
            const module = new PackageModule(path);
            
            
            if (property.value.type === 'ObjectExpression') {
                return this.traverseModules(property.value.properties, `${path}/`);
            }
            
            
            traverse(property.value.body, {
                enter(node) {
                    module.parse(node);
                },
            });
            
            this.modules[path] = module.exports;
            
            if (name !== 'package.json') {
                return;
            }
            if (this.type !== 'npm') {
                return;
            }
            if (!module.jsonContent) {
                throw new ModuleExportsError(`Unable to parse package.json for ${path}!`, property);
            }
            this.packageJson = Object.assign(this.packageJson || {
                name: '',
                version: '',
                main: '',
            }, module.jsonContent);
            
            this.name = this.name || this.packageJson.name;
            this.packageId = this.packageId || this.packageJson.name;
            this.mainModulePath = this.mainModulePath || this.packageJson.main;
        });
    }
    
}