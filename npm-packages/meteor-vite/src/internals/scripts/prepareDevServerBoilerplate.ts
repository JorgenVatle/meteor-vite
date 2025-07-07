import { ViteDevelopmentBoilerplate } from '@/internals/boilerplate/Development';
import { resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';

export async function prepareDevServerBoilerplate() {
    const { modules, needsReactPreamble, config } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    return new ViteDevelopmentBoilerplate({
        clientEntry: modules.clientEntry,
        needsReactPreamble,
        baseUrl: config.base,
    });
}