import { internalEntryModule, type MainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: MainModule) {
    {
        const { client, server } = internalEntryModule().production;
        
        // [PROD] Client
        client.vite.addImport({ path: 'vite/modulepreload-polyfill' });
        client.vite.addImport({ path: mainModule.client.vite.path });
        
        // [PROD] Server
        server.vite.addImport({ path: 'meteor-vite/server-entry/production' });
        server.vite.addImport({ path: mainModule.server.vite.path });
        
        client.vite.write();
        server.vite.write();
    }
    
    {
        const { client, server } = internalEntryModule().development;
        
        // [DEV] Client
        client.vite.addImport({ path: mainModule.client.vite.path });
        
        // [DEV] Server
        server.vite.addImport({ path: 'meteor-vite/server-entry/hmr' });
        server.vite.addImport({ path: mainModule.server.vite.path });
        
        client.vite.write();
        server.vite.write();
    }
}