Package.describe({
  name: 'zodern:relay',
  version: '1.1.1',
  // Brief, one-line summary of the package.
  summary: 'Type safe Meteor methods and publications',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/zodern/meteor-relay.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom(['2.2', '3.0']);
  api.use('typescript');
  api.use('ddp-rate-limiter');
  api.use('zodern:types@1.0.9');
  api.mainModule('server-main.ts', 'server');
  api.mainModule('client-main.ts', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('typescript');
  api.use('tinytest');
  api.use('mongo');
  api.use('zodern:relay');
  api.addFiles([
    'tests/methods/index.js',
    'tests/publications/index.js',
  ], 'server');
  api.addFiles([
    'tests/method-tests.js',
  ]);
  api.addFiles([
  'tests/publication-tests.js',
  ], 'client');
});
