import Path from 'node:path';
import pc from 'picocolors';
import { defineConfig, type Options } from 'tsup';

type Plugin = Required<Options>['esbuildPlugins'][number];

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


const log = (...messages: unknown[]) => {
    console.log(...messages.map((message) => {
        if (typeof message === 'string') {
            return pc.cyan(message);
        }
        return message;
    }));
}

function fixBuildPluginCjsImports(): Plugin {
    return {
        name: 'fix-build-plugin-cjs-imports',
        setup(build) {
            build.onResolve({ filter: /^meteor-vite/ }, (args) => {
                const parsed = Path.parse(args.path);
                const packageRoot = parsed.dir;
                const relativePath = Path.relative('meteor-vite', args.path);
                
                const newPath = Path.join('meteor-vite', 'dist', `${relativePath}.mjs`);
                
                log(`Rewriting external ${pc.yellow(packageRoot)} import for Meteor build plugin: ${pc.blue(args.path)} -> ${pc.green(newPath)}`);
                
                return {
                    path: newPath,
                    external: true,
                }
            })
        }
    } satisfies Plugin;
}

function meteorImportStubs(packages: {
    [key in string]: (symbol: string) => string;
}): Plugin {
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
    } satisfies Plugin;
}

export default defineConfig(() => ({
    name: 'jorgenvatle:vite',
    entry: [
        './packages/vite/src/entry/server-runtime.ts',
        './packages/vite/src/entry/build-plugin.ts'
    ],
    outDir: './packages/vite/dist',
    splitting: false,
    target: 'es2022',
    platform: 'node',
    keepNames: false,
    minify: false,
    tsconfig: "tsconfig.build.json",
    sourcemap: true,
    format: 'esm',
    esbuildPlugins: [
        fixBuildPluginCjsImports(),
        EsbuildPluginMeteorStubs,
    ],
    noExternal: ['meteor/isobuild', /meteor\//]
}));
