import { defineBuildConfig } from '../../npm-packages/@meteor-vite/toolkit/dist/index.mjs';

export default defineBuildConfig(import.meta.dirname, {
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
    sourcemap: false,
    noExternal: ['meteor/isobuild', /meteor\//]
});
