import Logger from '../../../utilities/Logger';
import { ViteDevelopmentBoilerplate } from '../boilerplate/Development';
import { resolveMeteorViteConfig } from '../lib/Config';

export async function initializeViteDevServer() {
    if (import.meta.env.PROD) {
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