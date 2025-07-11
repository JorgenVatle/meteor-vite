import { internalEntryModule, type MainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: { vite: MainModule, meteor: MainModule }) {
    const { vite, meteor } = internalEntryModule();
    
    {
        // [PROD] Vite Client
        vite.production.client.addImport({ path: 'vite/modulepreload-polyfill' });
        vite.production.client.addImport({ path: mainModule.vite.client.path });
        vite.production.client.write();
        
        // [PROD] Vite Server
        vite.production.server.addImport({ path: 'meteor-vite/server-entry/production' });
        vite.production.server.addImport({ path: mainModule.vite.server.path });
        vite.production.server.write();
    }
    
    {
        // [DEV] Vite Client
        vite.development.client.addImport({ path: mainModule.vite.client.path });
        vite.development.client.write();
        
        // [DEV] Vite Server
        vite.development.server.addImport({ path: 'meteor-vite/server-entry/hmr' });
        vite.development.server.addImport({ path: mainModule.vite.server.path });
        vite.development.server.write();
    }
}