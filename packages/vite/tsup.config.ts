import { defineConfig } from 'tsup';
import { EsbuildPluginMeteorStubs, fixBuildPluginCjsImports } from '../../build/tsup-plugins';

export default defineConfig({
    name: 'jorgenvatle:vite',
    entry: [
        './src/entry/server-runtime.ts',
        './src/entry/build-plugin.ts',
    ],
    splitting: false,
    target: 'es2022',
    platform: 'node',
    keepNames: false,
    minify: false,
    tsconfig: "./tsconfig.json",
    sourcemap: true,
    format: 'esm',
    esbuildPlugins: [
        fixBuildPluginCjsImports(),
        EsbuildPluginMeteorStubs,
    ],
    noExternal: ['meteor/isobuild', /meteor\//]
});
