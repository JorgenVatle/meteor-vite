import type { MeteorVitePluginOptions } from '@/plugin';
import { meteorWorker } from '@/plugin/vite-plugins/meteorWorker';
import type { PluginOption } from 'vite';

/**
 * Configure the Meteor-Vite compiler.
 *
 * @example vite.config.ts
 * export default defineConfig({
 *     plugins: [
 *         meteor({ clientEntry: './imports/entrypoint/vite.js' })
 *     ]
 * })
 */
export function meteor(config: MeteorVitePluginOptions): PluginOption {
    return meteorWorker(config);
}