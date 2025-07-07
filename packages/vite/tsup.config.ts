import { defineBuildConfig } from '../../build/defineBuildConfig';
import { fixBuildPluginCjsImports } from '../../build/tsup-plugins';

export default defineBuildConfig(__dirname, {
    name: 'jorgenvatle:vite',
    entry: [
        './src/entry/server-runtime.ts',
        './src/entry/build-plugin.ts',
    ],
    splitting: false,
    dts: false,
    platform: 'node',
    tsconfig: "./tsconfig.json",
    format: 'esm',
    esbuildPlugins: [
        fixBuildPluginCjsImports(),
    ],
    noExternal: ['meteor/isobuild', /meteor\//]
});
