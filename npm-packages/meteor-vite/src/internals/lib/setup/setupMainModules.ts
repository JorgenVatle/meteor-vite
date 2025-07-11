import { internalEntryModule, type MainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: { vite: MainModule, meteor: MainModule }) {
    const { meteor, vite: { development, production } } = internalEntryModule();
    
    {
        // [PROD] Vite Client
        production.client.addImport({ path: 'vite/modulepreload-polyfill' });
        production.client.addImport({ path: mainModule.vite.client.path });
        production.client.write();
        
        // [PROD] Vite Server
        production.server.addImport({ path: 'meteor-vite/server-entry/production' });
        production.server.addImport({ path: mainModule.vite.server.path });
        production.server.write();
    }
    
    {
        // [DEV] Vite Client
        development.client.addImport({ path: mainModule.vite.client.path });
        development.client.write();
        
        // [DEV] Vite Server
        development.server.addImport({ path: 'meteor-vite/server-entry/hmr' });
        development.server.addImport({ path: mainModule.vite.server.path });
        development.server.write();
    }
    
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
}