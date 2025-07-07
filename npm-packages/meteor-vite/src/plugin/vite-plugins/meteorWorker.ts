import type { PartialPluginConfig } from '@/plugin';
import { MeteorStubs } from '@/plugin/MeteorStubs';
import { meteorPluginConfig } from '@/plugin/vite-plugins/meteorPluginConfig';
import type { PluginOption } from 'vite';

/**
 * Internal worker plugin. Merges the user's config with necessary overrides for the Meteor compiler and loads the
 * MeteorStubs plugin.
 */
export function meteorWorker(config: PartialPluginConfig): PluginOption {
    return [
        meteorPluginConfig(config),
        MeteorStubs(),
    ];
}