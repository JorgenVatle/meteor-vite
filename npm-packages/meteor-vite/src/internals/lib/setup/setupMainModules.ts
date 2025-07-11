import { internalEntryModule, type MainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: MainModule) {
    {
        const { client, server } = internalEntryModule().production;
        
        // [PROD] Vite Client
        client.vite.addImport({ path: 'vite/modulepreload-polyfill' });
        client.vite.addImport({ path: mainModule.client.vite.path });
        client.vite.write();
        
        // [PROD] Vite Server
        server.vite.addImport({ path: 'meteor-vite/server-entry/production' });
        server.vite.addImport({ path: mainModule.server.vite.path });
        server.vite.write();
    }
    
    {
        const { client, server } = internalEntryModule().development;
        
        // [DEV] Vite Client
        client.vite.addImport({ path: mainModule.client.vite.path });
        client.vite.write();
        
        // [DEV:] Vite Server
        server.vite.addImport({ path: 'meteor-vite/server-entry/hmr' });
        server.vite.addImport({ path: mainModule.server.vite.path });
        server.vite.write();
    }
}