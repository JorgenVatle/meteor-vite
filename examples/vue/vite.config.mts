import tailwind from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { meteor } from 'meteor-vite/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue(),
    tailwind(),
    meteor({
      clientEntry: 'client/entry-vite.ts',
      serverEntry: 'server/entry-vite.ts',
      enableExperimentalFeatures: true,
      externalizeNpmPackages: ['test-externalization'],
      dynamicAssetBoilerplate: true,
      stubValidation: {
        warnOnly: true,
      },
      meteorStubs: {
        debug: true,
      },
    }),
  ],
})
