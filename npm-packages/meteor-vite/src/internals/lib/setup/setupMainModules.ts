import { internalEntryModule, type MainModule } from '@/internals/lib/internalEntryModule';

export function setupMainModules(mainModule: MainModule) {
    addDevelopmentImports(mainModule);
    addProductionImports(mainModule);
}

function addProductionImports(mainModule: MainModule) {
    const { production: { client, server } } = internalEntryModule();
    
    // Client
    client.vite.addImport({ path: 'vite/modulepreload-polyfill' });
    client.vite.addImport({ path: mainModule.client.vite.path });
    
    // Server
    server.vite.addImport({ path: 'meteor-vite/server-entry/production' });
    server.vite.addImport({ path: mainModule.server.vite.path });
    
    // Write files
    client.vite.write();
    server.vite.write();
}

function addDevelopmentImports(mainModule: MainModule) {
    const { development: { client, server } } = internalEntryModule();
    
    // Client
    client.vite.addImport({ path: mainModule.client.vite.path });
    
    // Server
    server.vite.addImport({ path: 'meteor-vite/server-entry/hmr' });
    server.vite.addImport({ path: mainModule.server.vite.path });
    
    // Write files
    client.vite.write();
    server.vite.write();
}