import Logger from '../../../utilities/Logger';
import { ViteDevelopmentBoilerplate } from '../boilerplate/Development';
import { resolveMeteorViteConfig } from '../lib/Config';

export async function initializeViteDevServer() {
    /**
     * This function is available in production and will be called if Meteor is
     * started with a non-production NODE_ENV. This prevents Meteor from
     * attempting to start the Vite dev server when running a completed
     * production bundle as that is likely not desired behavior and won't work
     * anyway since dev dependencies aren't available.
     */
    if (import.meta.env.MODE !== 'development') {
        Logger.info('Prevented the Vite dev server from firing up, as you are already running a production build.');
        return;
    }
    await import ('../DevelopmentEnvironment');
}

export async function prepareDevServerBoilerplate() {
    const { modules, needsReactPreamble, config } = await resolveMeteorViteConfig({
        mode: 'development'
    }, 'serve');
    
    return new ViteDevelopmentBoilerplate({
        clientEntry: modules.clientEntry,
        needsReactPreamble,
        baseUrl: config.base,
    });
}