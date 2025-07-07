import { resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { createServer, createServerModuleRunner } from 'vite';
import Instance from '../internals/MeteorViteRuntime';

Meteor.startup(async () => {
    const { config, modules } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    const server = await createServer(config);
    
    await server.warmupRequest(modules.clientEntry);
    
    // ⚡ [Server] Transform and load the Meteor main module using Vite.
    if (modules.serverEntry) {
        const runner = createServerModuleRunner(server.environments.server);
        Instance.logger.info(`Loading server entry: ${modules.serverEntry}`);
        
        // HMR listener to clean up side-effects from things like
        // Meteor.publish(), new Mongo.Collection(), etc. on server-side hot reload.
        try {
            await runner.import('meteor-vite/server-entrypoint/hmr');
            
            await runner.import(modules.serverEntry);
        } catch (error) {
            if (error instanceof Error) {
                server.ssrFixStacktrace(error);
            }
            throw error;
        }
    }
    
    // ⚡ [Vite] Bind Vite to Meteor's Express app to serve modules and assets to clients.
    WebApp.handlers.use(server.middlewares);
    Instance.printUrls(config);
})