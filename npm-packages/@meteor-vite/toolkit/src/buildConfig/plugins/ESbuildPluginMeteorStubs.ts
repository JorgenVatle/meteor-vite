import type { ESBuildPlugin } from '@/buildConfig';
import pc from 'picocolors';
import { log } from '../log';

/**
 * Intercept Meteor imports and inject an ESBuild-compatible module that
 * re-exports modules for known Meteor packages.
 */
export const EsbuildPluginMeteorStubs = meteorImportStubs({
    'isobuild': () => `const PluginGlobal = Plugin; export { PluginGlobal as Plugin }`,
    'meteor': (symbol) => `export const Meteor = ${symbol}?.Meteor || globalThis.Meteor`,
    'mongo': (symbol) => `export const { Mongo } = ${symbol} || {}`,
    'server-render': (symbol) => `export const { onPageLoad } = ${symbol} || {}`,
    'webapp': (symbol) => [
        `export const WebApp = ${symbol}?.WebApp || globalThis.WebApp`,
        `export const WebAppInternals = ${symbol}?.WebAppInternals || globalThis?.WebAppInternals`,
    ].join('\n'),
});


/**
 * Create stubs for Meteor imports paths.
 * Since ESBuild doesn't have access to the Meteor module graph, this can be
 * used to manually define expected export stubs for known Meteor packages.
 * @param packages
 */
function meteorImportStubs(packages: {
    [key in string]: (symbol: string) => string;
}): ESBuildPlugin {
    const filter = /^meteor\//;
    let stubId = 0;
    return {
        name: 'meteor-import-stubs',
        setup(build) {
            build.onResolve({ filter }, (args) => {
                return { path: args.path.replace(filter, '') , namespace: 'meteor' }
            })
            
            build.onLoad({ filter: /.*/, namespace: 'meteor' }, (args) => {
                log(`Stubbing Meteor package import: '${pc.green(args.path)}'`);
                
                const [packageName] = args.path.split('/');
                const stubFunction = packages[packageName];
                
                if (!stubFunction) {
                    throw new Error('Meteor package is missing stubs: ' + pc.yellow(args.path));
                }
                
                const stubSymbol = `PackageStub_${stubId++}`;
                return {
                    contents: `
                        const ${stubSymbol} = globalThis.Package?.[${JSON.stringify(packageName)}];
                        ${stubFunction(stubSymbol)}
                    `
                }
            })
        }
    } satisfies ESBuildPlugin;
}