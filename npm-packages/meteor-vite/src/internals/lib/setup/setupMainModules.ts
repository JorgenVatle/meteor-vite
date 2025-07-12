import { internalEntryModule, type MainModule, type ViteMainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: { vite: ViteMainModule, meteor: MainModule, buildOutput: MainModule }) {
    const { meteor: internalMeteorEntry, vite: { development, production}, buildOutput } = internalEntryModule();
    
    // [Vite Client]
    production.client.addImport({ path: 'vite/modulepreload-polyfill' });
    production.client.addImport({ path: mainModule.vite.client.path });
    production.client.write();
    
    development.client.addImport({ path: mainModule.vite.client.path });
    development.client.write();
    
    // [Vite Server]
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
    
    // [Build Output]
    {
        internalMeteorEntry.client.addImport({ path: buildOutput.client.path });
        internalMeteorEntry.client.write();
        
        internalMeteorEntry.server.addImport({ path: buildOutput.server.path });
        internalMeteorEntry.server.write();
    }
    
    // [Meteor Main Module]
    // Add internal module imports to app's Meteor mainModule.
    // This lets us un-lazy-load new packages by adding imports to our internal
    // modules instead of writing to to the app's source files directly,
    // apart from this one time here.
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