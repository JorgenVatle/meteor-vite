import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { meteor } from 'meteor-vite/plugin';
import zodernRelay from '@meteor-vite/plugin-zodern-relay';

export default defineConfig({
    plugins: [
        vue(),
        meteor({
            clientEntry: 'imports/entrypoint/vite-client.ts',
            serverEntry: 'server/main.ts',
            enableExperimentalFeatures: true,
        }),
        zodernRelay({
            directories: {
                /**
                 * Path to directories where your zodern:relay methods live
                 * @default ['./imports/methods']
                 */
                methods: ['./imports/api/relay/methods'],
                
                /**
                 * Path to the directories where your zodern:relay publications live.
                 * @default ['./imports/publications']
                 */
                publications: ['./imports/api/relay/publications'],
            }
        }),
    ],
    optimizeDeps: {
        exclude: [
            'ts-minitest',
        ]
    },
})
