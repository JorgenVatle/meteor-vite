import { internalEntryModule, type MainModule, type ViteMainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: { vite: ViteMainModule, meteor: MainModule, buildOutput: MainModule }) {
    const { meteor, vite: { development, production}, buildOutput } = internalEntryModule;
    
    // [Vite Client]
    production.client.addImport({ path: 'vite/modulepreload-polyfill' });
    production.client.addImport({ path: mainModule.vite.client.path });
    production.client.write();
    
    development.client.addImport({ path: mainModule.vite.client.path });
    development.client.write();
    
    // [Vite Server]
    if (mainModule.vite.server) {
        production.server.addImport({ path: 'meteor-vite/server-entry/production' });
        production.server.addImport({ path: mainModule.vite.server.path });
        production.server.write();
        
        development.server.addImport({ path: 'meteor-vite/server-entry/hmr' });
        development.server.addImport({ path: mainModule.vite.server.path });
        development.server.write();
    }
    
    // [Build Output]
    {
        meteor.client.addImport({ path: buildOutput.client.path });
        meteor.client.write();
        
        meteor.server.addImport({ path: buildOutput.server.path });
        meteor.server.write();
    }
    
    // [Meteor Main Module]
    // Add internal module imports to app's Meteor mainModule.
    // This lets us un-lazy-load new packages by adding imports to our internal
    // modules instead of writing to to the app's source files directly,
    // apart from this one time here.
    {
        // Client
        mainModule.meteor.client.addImport({ path: meteor.client.path });
        mainModule.meteor.client.appendMissing();
        
        // Server
        mainModule.meteor.server.addImport({ path: meteor.server.path });
        mainModule.meteor.server.appendMissing();
    }
    
    return {
        meteor,
        vite: {
            development,
            production,
        },
    }
}