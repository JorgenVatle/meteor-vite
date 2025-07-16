import type { PartialPluginConfig } from '@/plugin';
import { meteorModuleStubs } from '@/plugin/vite-plugins/meteorModuleStubs';
import { meteorPluginConfig } from '@/plugin/vite-plugins/meteorPluginConfig';
import type { Plugin } from 'vite';

/**
 * Internal worker plugin. Merges the user's config with necessary overrides for the Meteor compiler and loads the
 * MeteorStubs plugin.
 */
export function meteorWorker(config: PartialPluginConfig): (Plugin | Promise<Plugin>)[] {
    return [
        meteorPluginConfig(config),
        meteorModuleStubs(),
    ];
}