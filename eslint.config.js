const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  ignores: [
    'examples/output/',
    '.meteor',
  ],
})