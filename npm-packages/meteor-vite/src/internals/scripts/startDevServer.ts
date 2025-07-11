/// <reference types="vite/client" />
import Instance from '@/internals/lib/MeteorViteRuntime';
import { resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { ViteBundleLogger as Logger } from '@/utilities/server';
import { WebApp } from 'meteor/webapp';
import { createServer, createServerModuleRunner } from 'vite';

export async function startDevServer() {
    /**
     * This function is available in production and will be called if Meteor is
     * started with a non-production NODE_ENV. This prevents Meteor from
     * attempting to start the Vite dev server when running a completed
     * production bundle as that is likely not desired behavior and won't work
     * anyway since dev dependencies aren't available.
     */
    if (import.meta?.env?.MODE === 'production') {
        Logger.info('Prevented the Vite dev server from firing up, as you are already running a production build.');
        return;
    }
    
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
            await runner.import('meteor-vite/server-entry/hmr');
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
    
    Logger.success('Vite should be ready to go!');
}

