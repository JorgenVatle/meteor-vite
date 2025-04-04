import { defineConfig } from 'vite'
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        meteor({
            clientEntry: 'imports/entrypoints/vite-client.ts',
        }),
    ],
    optimizeDeps: {},
})
