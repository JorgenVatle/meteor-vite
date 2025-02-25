Package.describe({
  name: 'jorgenvatle:vitest',
  version: '0.0.1',
  summary: 'summary',
  git: 'https://github.com/JorgenVatle/meteor-vite',
  documentation: 'README.md',
})

Package.onUse(function(api) {
  api.use('ecmascript')
  api.mainModule('index.js', ['server']);
})
