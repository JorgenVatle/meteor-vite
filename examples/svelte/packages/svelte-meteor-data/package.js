Package.describe({
  name: 'rdb:svelte-meteor-data',
  version: '1.0.0',
  summary: 'Reactively track Meteor data inside Svelte components',
  git: 'https://github.com/rdb/svelte-meteor-data',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom(['1.8', '3.0-rc.2']);
  api.use('ecmascript');
  api.use('tracker');
  api.use('tmeasday:check-npm-versions@2.0.0', {weak:true});
  api.use('svelte:compiler@3.31.2 || 3.25.0', {weak: true});
  api.use('reactive-var', {weak: true});
  api.use('session', 'client', {weak: true});
  api.use('mongo', {weak: true});
  api.mainModule('index.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('rdb:svelte-meteor-data');
  api.use('tmeasday:check-npm-versions@1.0.2');
  api.use('reactive-var');
  api.use('session', 'client');
  api.addFiles('reactive-var.tests.js');
  api.addFiles('use-session.tests.js', 'client');
});
