import { Meteor } from 'meteor/meteor';

/**
 * Assign information about the current bundle to the app's runtime settings.
 *
 * This is necessary as there doesn't appear to be any good/reliable way to
 * determine whether Meteor is running a Vite production bundle.
 *
 * With the production bundle, meteor-vite is bundled into the main application
 * code and is no longer accessible. This lets us instruct the server runtime
 * to not attempt to initialize any Vite modules since they're already
 * included in the app at this point.
 */
export const meteorSettings = {
    base: process.env.METEOR_VITE_BASE_URL || import.meta.env.BASE_URL,
    assetsDir: __VITE_ASSETS_DIR__,
    env: import.meta.env,
} as const;

/**
 * Runtime settings for the Vite bundle, assigned to Meteor's settings object.
 * {@link Meteor.settings}
 */
export type MeteorPackageSettings = typeof meteorSettings;

const userSettings = Meteor.settings.packages?.['jorgenvatle:vite'] || {}

Meteor.settings.packages = Object.assign(
    {
        'jorgenvatle:vite': Object.assign(meteorSettings, userSettings)
    },
    Meteor.settings.packages
);