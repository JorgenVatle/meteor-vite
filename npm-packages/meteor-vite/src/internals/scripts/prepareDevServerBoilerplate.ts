import { ViteDevelopmentBoilerplate } from '@/internals/boilerplate/Development';
import { MeteorViteCompilerPlugin } from '@/internals/lib/MeteorViteCompilerPlugin';
import { CurrentConfig, resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';

export async function prepareDevServerBoilerplate() {
    const { modules, needsReactPreamble, config } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    return new MeteorViteCompilerPlugin({
        outDir: '',
        assetsDir: '',
        mode: CurrentConfig.mode,
        boilerplate: new ViteDevelopmentBoilerplate({
            clientEntry: modules.clientEntry,
            needsReactPreamble,
            baseUrl: config.base,
        }),
        dynamicAssetBoilerplate: false,
    })
}