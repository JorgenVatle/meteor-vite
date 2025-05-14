Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.5.2',
    summary: `⚡ Speeds up Meteor's build and HMR processes using Vite`,
    documentation: 'README.md'
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [
        'ecmascript',
    ],
    sources: [
        'dist/build-plugin.mjs',
    ],
});

Package.onUse((api) => {
    api.versionsFrom(['3.0', '3.1', '3.2']);
    api.use([
        'isobuild:compiler-plugin@1.0.0',
        'ecmascript',
    ]);

    api.mainModule('dist/server-runtime.mjs', ['server'], { bare: false });
});