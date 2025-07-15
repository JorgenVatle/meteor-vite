import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
      vue(),
      meteor({
        clientEntry: 'imports/ui/client.ts',
        serverEntry: 'server/main.ts',
        enableExperimentalFeatures: true,
      })
  ],
  optimizeDeps: {
    exclude: ['vue-meteor-tracker'],
  },
})
