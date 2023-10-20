import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * @param npmPackages {string[]}
 * @return {import('vite').Plugin}
 */
function useMeteorBundle({
  npmPackages = [],
}) {
  /**
   * @type {{npmPackage: string, chunkPath: string}[]}
   */
  const detectedChunks = [];
  return {
    name: 'output-gen',
    enforce: 'pre',
    resolveId(id, importer, options) {
      if (!importer) return;

      const npmPackage = npmPackages.find((name) => importer.includes(`/${name}.js?`));
      if (!npmPackage) return;

      const chunk = {
        npmPackage,
        chunkPath: id.replace(/^.\//, ''),
      };

      detectedChunks.push(chunk);
      console.log({ id, importer, options, chunk });
    },
    transform(code, id) {
      if (!detectedChunks.length) {
        return;
      }
      const chunk = detectedChunks.find(({ chunkPath }) => id.includes(`.vite/deps/${chunkPath}`));
      if (!chunk) {
        return;
      }
      console.log({ transformId: id, chunk });
      const exportKey = `require_${chunk.npmPackage.replace(/\//g, '_')}`
      return `
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __commonJS = (cb, mod) => function __require() {
        return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
      };
      var ${exportKey} = () => require('${chunk.npmPackage}');
      export {
        __commonJS,
        ${exportKey},
      }`
    },
  }
}

export default defineConfig({
  plugins: [
      react(),
      useMeteorBundle({
        npmPackages: ['react']
      }),
  ],

  meteor: {
    clientEntry: 'imports/vite-entrypoint.jsx',
  },
})
