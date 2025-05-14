import { svelte } from '@sveltejs/vite-plugin-svelte';
import { meteor } from 'meteor-vite/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svelte({
      configFile: 'svelte.config.mjs'
    }),
    meteor({
        clientEntry: 'client/entry-vite.ts',
        serverEntry: 'server/entry-vite.ts',
        enableExperimentalFeatures: true,
        stubValidation: {
          warnOnly: true,
        }
    })
  ],
})
