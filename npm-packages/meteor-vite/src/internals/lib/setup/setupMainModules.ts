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
}