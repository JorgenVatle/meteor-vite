Package.describe({
    name: 'jorgenvatle:vite',
    version: '1.2.0',
    summary: `⚡ Speeds up Meteor's build and HMR processes using Vite`,
    documentation: 'README.md'
});

Package.registerBuildPlugin({
    name: 'vite',
    use: [
        'ecmascript@0.16.9 || 0.16.10',
    ],
    sources: [
        'dist/build-plugin.mjs',
    ],
});

Package.onUse((api) => {
    api.versionsFrom(['3.0', '3.1']);
    api.use([
        'isobuild:compiler-plugin@1.0.0',
        'ecmascript',
        'server-render',
        'webapp',
    ]);

    api.mainModule('dist/server-runtime.mjs', ['server'], { bare: false });
    api.addFiles('dist/cordova-runtime.mjs', ['web.cordova']);
});