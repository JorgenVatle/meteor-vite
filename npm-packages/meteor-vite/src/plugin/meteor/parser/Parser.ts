import { parse } from '@babel/parser';
import {
    type FunctionExpression,
    is,
    isCallExpression,
    isFunctionExpression,
    isIdentifier,
    isMemberExpression,
    isObjectExpression,
    isObjectProperty,
    isReturnStatement,
    isStringLiteral,
    Node,
    ObjectMethod,
    ObjectProperty,
    traverse,
} from '@babel/types';
import FS from 'fs/promises';
import { MeteorInstall } from './MeteorInstall';
import { ModuleExportsError, ParserError } from './ParserError';

export interface ParseOptions {
    /**
     * Absolute file path to the package's JavaScript file.
     * This file needs to have been built by Meteor.
     * The package source code is not handled by the parser.
     */
    filePath: string;
    
    /**
     * Optionally use file content from memory instead of pulling the file content during parser setup.
     * Used primarily to for performance reasons in mock tests and potentially within the Vite plugin load requests.
     *
     * We still want the filePath property to maintain good traceability in error messages.
     */
    fileContent?: Promise<string> | string;
}

export async function parseMeteorPackage({ fileContent, filePath }: ParseOptions) {
    const startTime = Date.now();
    const content = (fileContent || FS.readFile(filePath, 'utf-8'))
    
    const result: ParsedPackage = await parseSource(await content);
    
    if (!result.name) {
        throw new ParserError(`Could not extract name from package in: ${filePath}`, {
            parseOptions: { fileContent, filePath },
        });
    }
    
    if (!result.packageId) {
        result.packageId = `meteor/${result.name}`;
    }
    
    const moduleExports = Object.keys(result.modules);
    const packageExports = Object.keys(result.packageScopeExports);
    
    if (!moduleExports.length && !packageExports.length) {
        console.warn(
            'Unable to retrieve any metadata from the provided source code!',
            { result }
        );
        throw new ParserError(`No modules or package-scope exports could be extracted from package: ${result.name}`);
    }
    
    return {
        result,
        timeSpent: `${Date.now() - startTime}ms`,
    }
}


function parseSource(code: string) {
    return new Promise<ParsedPackage>((resolve, reject) => {
        const source = parse(code);
        const result: ParsedPackage = {
            name: '',
            modules: {},
            packageScopeExports: {},
            mainModulePath: '',
            packageId: '',
            node_modules: [],
        }
        
        traverse(source, {
            enter(node) {
                const packageScope = parsePackageScope(node);
                const { atmosphere, npm } = MeteorInstall.parse(node);
                result.mainModulePath = readMainModulePath(node) || result.mainModulePath;
                
                if (atmosphere) {
                    atmosphere.mainModulePath = atmosphere.mainModulePath || result.mainModulePath;
                    Object.assign(result, atmosphere)
                }
                
                if (npm) {
                    result.node_modules?.push(...npm);
                }
                
                if (packageScope) {
                    result.name = result.name || packageScope.name;
                    result.packageScopeExports[packageScope.name] = packageScope.exports;
                }
                
                if (packageScope?.mainModulePath) {
                    result.mainModulePath = packageScope.mainModulePath;
                }
            }
        });
        
        resolve(result);
    })
}

/**
 * Try to determine a package's mainModule path by reading the root exports declaration.
 *
 * @example bundle export
 * var exports = require("/node_modules/meteor/test:ts-modules/index.ts");
 */
function readMainModulePath(node: Node) {
    // (Meteor v2)
    if (node.type !== 'VariableDeclarator') return;
    if (!is('Identifier', node.id, { name: 'exports' })) return;
    if (node.init?.type !== 'CallExpression') return;
    if (!is('Identifier', node.init.callee, { name: 'require' })) return;
    if (node.init.arguments[0]?.type !== 'StringLiteral') return;
    
    // node_modules/meteor/<author>:<packageName>/<mainModule>
    return node.init.arguments[0].value;
}

/**
 * Parse exports at the package namespace. This would be things like global packages (Meteor, Mongo, etc)
 *
 * @example bundle export
 * Package._define("mongo", {
 *   Mongo: Mongo
 * });
 */
function parsePackageScope(node: Node): undefined | { name: string, exports: string[], mainModulePath?: string } {
    function meteorV2(node: Node) {
        if (node.type !== 'CallExpression') return;
        if (node.callee.type !== 'MemberExpression') return;
        const { object, property } = node.callee;
        if (object.type !== 'Identifier') return;
        if (object.name !== 'Package') return;
        if (property.type !== 'Identifier') return;
        if (property.name !== '_define') return;
        
        const args = {
            packageName: node.arguments[0],
            moduleExports: node.arguments[1],
            packageExports: node.arguments[2],
        }
        
        if (args.packageName.type !== 'StringLiteral') {
            throw new ModuleExportsError('Unexpected type received for package name!', args.packageName);
        }
        
        /**
         * Deals with the meteor/meteor core packages that don't use the module system.
         */
        if (!args.packageExports && args.moduleExports?.type === 'ObjectExpression') {
            args.packageExports = args.moduleExports;
        }
        
        const packageExport = {
            name: args.packageName.value,
            exports: [] as string[],
        };
        
        /**
         * Module is likely a lazy-loaded package or one that only provides side effects as there are no exports in any
         * form.
         */
        if (!args.packageExports) {
            return packageExport;
        }
        
        if (args.packageExports.type !== 'ObjectExpression') {
            throw new ModuleExportsError('Unexpected type received for package-scope exports argument!', args.packageExports);
        }
        
        args.packageExports.properties.forEach((property) => {
            if (property.type === 'SpreadElement') {
                throw new ModuleExportsError('Unexpected property type received for package-scope exports!', property)
            }
            
            packageExport.exports.push(propParser.getKey(property));
        })
        
        return packageExport;
    }
    
    
    function meteorV3(node: Node) {
        if (!isCallExpression(node)) return;
        if (!isMemberExpression(node.callee)) return;
        if (!isIdentifier(node.callee.property, { name: 'queue' })) return;
        if (!isStringLiteral(node.arguments[0])) return;
        
        const packageName = node.arguments[0].value;
        let packageClosure: FunctionExpression | null = null;
        let mainModulePath: string | null = null;
        const exports: string[] = [];
        
        // Meteor V3 (Release Candidate)
        if (isFunctionExpression(node.arguments[1])) {
            packageClosure = node.arguments[1];
        }
        
        // Meteor V3 (Beta)
        if (isFunctionExpression(node.arguments[2])) {
            packageClosure = node.arguments[2];
        }
        
        if (!packageClosure) {
            return;
        }
        
        for (const node of packageClosure.body.body) {
            if (!isReturnStatement(node)) continue;
            if (!isObjectExpression(node.argument)) continue;
            for (const property of node.argument.properties) {
                if (!isObjectProperty(property)) continue;
                
                // Parse package-level exports
                if (isIdentifier(property.key, { name: 'export' })) {
                    if (!isFunctionExpression(property.value)) continue;
                    const exportBody = property.value.body.body;
                    for (const node of exportBody) {
                        if (!isReturnStatement(node)) continue;
                        if (!isObjectExpression(node.argument)) continue;
                        node.argument.properties.forEach((node) => {
                            if (!isObjectProperty(node)) return;
                            if (!isIdentifier(node.key)) return;
                            exports.push(node.key.name);
                        });
                    }
                    continue;
                }
                
                // Parse mainModulePath
                if (isIdentifier(property.key, { name: 'mainModulePath' })) {
                    if (!isStringLiteral(property.value)) continue;
                    mainModulePath = property.value.value;
                }
            }
        }
        
        return { name: packageName, exports, mainModulePath };
    }
    
    return meteorV2(node) || meteorV3(node);
}

export const propParser = {
    getKey<TProperty extends ObjectMethod | ObjectProperty>(property: TProperty) {
        if (property.key.type === 'Identifier') {
            return property.key.name;
        }
        if (property.key.type === 'StringLiteral') {
            return property.key.value;
        }
        
        throw new ModuleExportsError('Unsupported property key type!', property);
    },
}

/**
 * Meteor package-level exports.
 * {@link https://docs.meteor.com/api/packagejs.html#PackageAPI-export}
 */
export type PackageScopeExports = Record<string, string[]>;
export type ModuleList = { [key in string]: ModuleExportData[] };
export type ModuleExportData = {
    /**
     * "Name" of the object to be exported.
     * @example ts
     * export const <name> = '...'
     */
    name?: string,
    type: 'export' // Named export (export const fooBar = '...')
          | 're-export' // Exporting properties from another module. (export { fooBar } from './somewhere'  )
          | 'global-binding' // Meteor globals. (`Meteor`, `DDP`, etc) These should likely just be excluded from the vite stubs.
          | 'export-default' // Default module export (export default fooBar);
    
    /**
     * Internal Meteor ID for a linked Meteor module.
     * This isn't really all that useful apart from testing.
     */
    id?: number;
    
    /**
     * The module we're re-exporting from. This only applies to re-exports.
     * @example ts
     * export { foo } from '<from>'
     */
    from?: string;
    
    /**
     * The value of the "as" keyword when exporting a module.
     * @example ts
     * export { foo as bar }
     */
    as?: string;
};

export interface ParsedPackage {
    /**
     * Meteor Atmosphere package name.
     * E.g. ostrio:cookies, accounts-base, ddp
     */
    name: string;
    
    /**
     * List of ES modules included in this package.
     */
    modules: ModuleList;
    
    /**
     * List of npm packages bundled with this package.
     * This probably only applies to Meteor's `modules.js` package.
     */
    node_modules?: MeteorInstall[];
    
    /**
     * Path to the package's mainModule as defined with `api.mainModule(...)`
     * {@link https://docs.meteor.com/api/packagejs.html}
     *
     * Format: /node_modules/meteor/<author>:<packageName>/<mainModule>
     * @example
     * '/node_modules/meteor/ostrio:cookies/main.js'
     */
    mainModulePath?: string | null;
    
    /**
     * Meteor package-level exports.
     * {@link https://docs.meteor.com/api/packagejs.html#PackageAPI-export}
     */
    packageScopeExports: PackageScopeExports;
    
    /**
     * Whether the parsed package is a Meteor-bundled npm package from modules.js or a normal Meteor package.
     */
    type?: 'atmosphere' | 'npm';
    
    /**
     * Base Atmosphere package import This is usually where we find the full package content, even for packages
     * that have multiple entry points.
     * E.g. `meteor/ostrio:cookies`, `meteor/meteor`, `meteor/vite:bundler`
     */
    packageId: string;
}