import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
    vue(),
    meteor({
      clientEntry: 'imports/ui/main.ts',
      serverEntry: 'server/main.ts',
      enableExperimentalFeatures: true,
      externalizeNpmPackages: ['test-externalization'],
      stubValidation: {
        warnOnly: true,
      }
    }),
  ],
  optimizeDeps: {
    exclude: [
        'ts-minitest',
    ]
  },
})
