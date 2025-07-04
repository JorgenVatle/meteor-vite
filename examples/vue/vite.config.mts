import vue from '@vitejs/plugin-vue';
import { meteor } from 'meteor-vite/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue(),
    meteor({
      clientEntry: 'client/entry-vite.ts',
      serverEntry: 'server/entry-vite.ts',
      enableExperimentalFeatures: true,
      externalizeNpmPackages: ['test-externalization'],
      stubValidation: {
        warnOnly: true,
      },
      meteorStubs: {
        debug: true,
      },
    }),
  ],
})
