import { internalEntryModule, type MainModule, type ViteMainModule } from '@/internals/lib/internalEntryModule';

export function setupEntryModules(mainModule: { vite: ViteMainModule, meteor: MainModule }) {
    const {
        meteor: internalMeteorEntry,
        vite: { development, production },
        buildOutput,
    } = internalEntryModule();
    
    /**
     * [Vite Client]
     *
     * This will be used as the actual Vite client entrypoint. Both when
     * building for production and during development.
     *
     * @location /_vite-bundle/client
     */
    {
        production.client.addImport({ path: 'vite/modulepreload-polyfill' });
        production.client.addImport({ path: mainModule.vite.client.path });
        production.client.write();
        
        development.client.addImport({ path: mainModule.vite.client.path });
        development.client.write();
    }
    
    /**
     * [Vite Server]
     *
     * This will be used as the actual server entrypoint, both when building
     * with Vite for production, and during development.
     * Some of these modules are necessary regardless of whether the user
     * enables building the Meteor server with Vite.
     *
     * The production server entry configures Meteor's WebApp to serve assets
     * built by Vite statically instead of through Meteor's default build
     * system.
     *
     * The HMR server entry is a series of HMR hooks to clean up side-effects
     * from common Meteor packages. Things like resetting publications and
     * defined collections. This is only used if server builds are enabled.
     *
     * @location /_vite-bundle/server
     */
    {
        production.server.addImport({ path: 'meteor-vite/server-entry/production' });
        development.server.addImport({ path: 'meteor-vite/server-entry/hmr' });
        
        if (mainModule.vite.server) {
            production.server.addImport({ path: mainModule.vite.server.path });
            development.server.addImport({ path: mainModule.vite.server.path });
        }
        production.server.write();
        development.server.write();
    }
    
    /**
     * [Internal Meteor mainModule]
     *
     * Imports Vite's finished production bundle into Meteor so that our
     * Meteor build plugin gets to process the bundle further.
     *
     * An import for both these modules is injected into the app's actual
     * Meteor mainModule
     *
     * @location /_vite-bundle
     */
    {
        internalMeteorEntry.client.addImport({ path: buildOutput.client.path });
        internalMeteorEntry.client.write();
        
        internalMeteorEntry.server.addImport({ path: buildOutput.server.path });
        internalMeteorEntry.server.write();
    }
    
    /**
     * [App Meteor mainModule]
     *
     * Add internal module imports to app's Meteor mainModule.
     *
     * This lets us un-lazy-load new packages by adding imports to our internal
     * modules instead of writing to the app's source files directly, apart from
     * this one time here.
     *
     * @location package.json
     */
    {
        // Client
        mainModule.meteor.client.addImport({ path: internalMeteorEntry.client.path });
        mainModule.meteor.client.appendMissing();
        
        // Server
        mainModule.meteor.server.addImport({ path: internalMeteorEntry.server.path });
        mainModule.meteor.server.appendMissing();
    }
    
    return {
        meteor: internalMeteorEntry,
        vite: {
            development,
            production,
        },
    }
}