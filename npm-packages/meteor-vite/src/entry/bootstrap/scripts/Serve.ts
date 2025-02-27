import { createVitest } from 'vitest/node';
import { ViteDevelopmentBoilerplate } from '../boilerplate/Development';
import { resolveMeteorViteConfig } from '../lib/Config';

export async function initializeViteDevServer() {
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

export async function runTests() {
    const { config, modules,  } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    const vitest = await createVitest('test', {
        config: config.configFile,
        watch: false,
    });
    
    // Todo: Create custom runner that will run tests within the current Meteor environment.
    const results = await vitest.start();
    console.log('Vitest result: ', results);
    
    if (vitest.state.getCountOfFailedTests()) {
        throw new Error('Tests failed')
    }
    
    
}