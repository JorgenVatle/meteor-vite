import { defineConfig } from 'tsup';
import { EsbuildPluginMeteorStubs, fixBuildPluginCjsImports } from './build/tsup-plugins';

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
