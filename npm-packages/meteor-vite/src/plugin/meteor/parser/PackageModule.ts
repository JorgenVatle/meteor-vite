import {
    isAssignmentExpression,
    isBooleanLiteral,
    isCallExpression,
    isIdentifier,
    isMemberExpression,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    Node,
    NumericLiteral,
    ObjectExpression,
    StringLiteral,
} from '@babel/types';
import Logger from '../../../utilities/Logger';
import { ModuleExportData, propParser } from './Parser';
import { ModuleExportsError } from './ParserError';
import { KnownModuleMethodNames, ModuleMethod, ModuleMethodName } from './ParserTypes';

/**
 * An individual file within a built Meteor package's meteorInstall file tree.
 * It essentially represents a single file and its associated exports within a given Meteor package.
 * E.g. `index.js` or `cookie-store.js`.
 *
 * {@link https://github.com/JorgenVatle/meteor-vite/blob/78a451fa311989d10cbb061bb929d8feb795ea2c/npm-packages/meteor-vite/test/__mocks/meteor-bundle/test_ts-modules.js#L20 `explicit-relative-path.ts`} would count as a module here.
 */
export class PackageModule {
    public readonly exports: ModuleExportData[] = [];
    public jsonContent?: Record<string, string>
    
    constructor(public readonly path: string) {
    }
    
    /**
     * Helper for checking if an already validated node is of the provided method
     */
    protected isMethod<MethodName extends ModuleMethodName>(
        node: ModuleMethod.MethodMap[ModuleMethodName],
        method: MethodName,
    ): node is ModuleMethod.MethodMap[MethodName] {
        return node.callee.property.name === method;
    }
    
    /**
     * Check if provided node is a valid `module.[method]` call expression.
     */
    protected isModuleMethodCall(node: Node): node is ModuleMethod.MethodMap[ModuleMethodName] {
        if (node.type !== 'CallExpression') return false;
        
        const callee = node.callee;
        
        if (callee.type !== 'MemberExpression') return false;
        if (callee.object.type !== 'Identifier') return false;
        if (!callee.object.name.match(/^module\d*$/)) return false;
        if (callee.property.type !== 'Identifier') return false;
        const calleeMethod = callee.property.name;
        
        if (!KnownModuleMethodNames.includes(calleeMethod as ModuleMethodName)) {
            Logger.warn(`Meteor module.${calleeMethod}(...) is not recognized by Meteor-Vite! Please open an issue to get this resolved! 🙏 (Found in ${this.path})`);
            return false;
        }
        
        return true;
    }
    
    protected getModuleExportsAssignment(node: Node) {
        if (!isAssignmentExpression(node)) return;
        if (!isMemberExpression(node.left)) return;
        if (!isIdentifier(node.left.object, { name: 'module' })) return;
        if (!isIdentifier(node.left.property, { name: 'exports' })) return;
        
        return node.right;
    }
    
    protected getCjsExportAssignment(node: Node) {
        if (!isAssignmentExpression(node)) return;
        if (!isMemberExpression(node.left)) return;
        if (!isIdentifier(node.left.object, { name: 'exports' })) return;
        if (!isIdentifier(node.left.property)) return;
        
        return node.left.property;
    }
    
    /**
     * Parse everything within the current module and store detected exports.
     * Todo: Possibly migrate parsers to their own class to save on memory usage?
     */
    public parse(node: Node) {
        const moduleExports = this.getModuleExportsAssignment(node);
        const cjsExport = this.getCjsExportAssignment(node);
        
        if (cjsExport) { // export.<name> = (...)
            this.exports.push({
                name: cjsExport.name,
                type: 'export',
            });
            return;
        }
        
        
        if (moduleExports) {
            if (isCallExpression(moduleExports)) { // module.exports = require('..')
                if (!isIdentifier(moduleExports.callee, { name: 'require' })) return;
                if (!isStringLiteral(moduleExports.arguments[0])) return;
                
                // Prevent duplicate default exports - React has a conditional export that can cause some issues
                if (!this.exports.find(({ as, name }) => (as || name) === 'default')) {
                    this.exports.push({
                        type: 'export',
                        name: 'default',
                    })
                }
                this.exports.push({
                    type: 're-export',
                    from: moduleExports.arguments[0].value,
                    name: '*'
                });
                return;
            }
            if (!isObjectExpression(moduleExports)) {
                return;
            }
            if (this.path.endsWith('map.json')) {
                return; // Skip parsing source maps
            }
            if (this.path.endsWith('package.json')) {
                this.parseJson(moduleExports);
            }
            this.exports.push(...formatExports({ expression: moduleExports }));
        }
        
        if (!this.isModuleMethodCall(node)) return;
        
        if (this.isMethod(node, 'link')) {
            return this.exports.push(...this.parseLink(node));
        }
        
        if (this.isMethod(node, 'export')) {
            return this.exports.push(...this.parseExport(node));
        }
        
        if (this.isMethod(node, 'exportDefault')) {
            this.exports.push(...this.parseExportDefault(node));
            return;
        }
    }
    
    protected parseJson(moduleExports: ObjectExpression) {
        this.jsonContent = {};
        for (const prop of moduleExports.properties) {
            if (!isObjectProperty(prop)) {
                throw new ModuleExportsError('JSON module had an unexpected property export', prop);
            }
            
            const key = propParser.getKey(prop);
            
            if (isStringLiteral(prop.value)) {
                Object.assign(this.jsonContent, { [key]: prop.value.value });
                continue;
            }
            
            if (key !== 'browser' || !isObjectExpression(prop.value)) {
                Logger.warnOnce(
                    { id: `unknown-package-json-field-type:${key}` },
                    new ModuleExportsError(`Meteor bundle had a package.json key (${key}) with an unexpected value.\nThis might be important to properly parse the module's entrypoint. Do open a new issue if you run into any issues. 🙏`, prop)
                );
                continue;
            }
            
            const browser: Record<string, string> = {};
            Object.assign(this.jsonContent, { browser });
            
            for (const browserProp of prop.value.properties) {
                if (!isObjectProperty(browserProp)) {
                    Logger.warnOnce(
                        { id: `unknown-package-json-browser-field-type` },
                        new ModuleExportsError('Meteor bundle had a package.json browser property with an unexpected value!', prop)
                    );
                    continue;
                }
                
                const key = propParser.getKey(browserProp);
                
                if (!isBooleanLiteral(browserProp.value)) {
                    Logger.warnOnce(
                        { id: 'unknown-package-json-browser-value' },
                        new ModuleExportsError(`Meteor bundle had a package.json browser[${key}] property with an unexpected value!`, prop)
                    );
                    continue;
                }
                
                Object.assign(browser, { [key]: browserProp.value.value });
            }
            
        }
    }
    
    /**
     * Parse a Meteor bundle's `module.link()` call.
     * {@link ModuleMethod.Link}
     */
    protected parseLink(node: ModuleMethod.WithoutArgs<'link'>) {
        const [importPath, exports, id] = node.arguments;
        
        if (importPath.type !== 'StringLiteral') {
            throw new ModuleExportsError('Expected string as the first argument in module.link()!', importPath);
        }
        
        // Module.link('./some-path') without any arguments.
        // Translates to `import './some-path' - so no exports to be found here. 👍
        if (!exports) return [];
        
        if (exports.type !== 'ObjectExpression') {
            throw new ModuleExportsError(
                'Expected ObjectExpression as the second argument in module.link()!',
                importPath,
            );
        }
        if (id?.type !== 'NumericLiteral') {
            throw new ModuleExportsError('Expected NumericLiteral as the last argument in module.link()!', importPath);
        }
        
        return formatExports({
            packageName: importPath,
            expression: exports,
            id,
        });
    }
    
    /**
     * Parse a Meteor bundle's `module.export({ ... })` call.
     * {@link ModuleMethod.export see type for examples}
     */
    protected parseExport(node: ModuleMethod.WithoutArgs<'export'>) {
        if (node.arguments[0].type !== 'ObjectExpression') {
            throw new ModuleExportsError('Unexpected export type!', exports);
        }
        
        return formatExports({
            expression: node.arguments[0],
        });
    }
    
    /**
     * Parse a Meteor bundle's `module.exportDefault()` call.
     * {@link ModuleMethod.exportDefault see examples in type declaration}
     */
    protected parseExportDefault(node: ModuleMethod.WithoutArgs<'exportDefault'>) {
        const args = node.arguments;
        let name = 'default';
        if (args[0].type === 'Identifier') {
            name = args[0].name;
        } else if (args[0].type === 'ConditionalExpression') {
            name = 'CONDITIONAL_EXPORT_DEFAULT';
        } else {
            new ModuleExportsError('Unexpected default export value!', args[0]);
        }
        
        // todo: test for default exports with `export default { foo: 'bar' }`
        return [{ type: 'export-default', name } satisfies ModuleExportData];
    }
}

function formatExports({ expression, packageName, id }: {
    expression: ObjectExpression,
    packageName?: StringLiteral,
    id?: NumericLiteral,
}) {
    return expression.properties.map((property) => {
        if (property.type === 'SpreadElement') throw new ModuleExportsError('Unexpected property type!', property);
        const result: ModuleExportData = {
            name: propParser.getKey(property),
            type: 'export',
            ...id && { id: id.value },
        };
        
        if (packageName) {
            result.type = 're-export';
            result.from = packageName.value;
        }
        
        if (result.type === 're-export' && property.type === 'ObjectMethod') {
            result.type = 'global-binding';
        }
        
        if (result.type === 're-export' && property.type === 'ObjectProperty') {
            const content = property.value;
            if (content.type !== 'StringLiteral') {
                throw new ModuleExportsError('Received unsupported result type in re-export!', property);
            }
            
            if (content.value !== result.name) {
                result.as = content.value;
            }
        }
        
        return result;
    });
    
}