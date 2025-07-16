import { ViteDevelopmentBoilerplate } from '@/internals/boilerplate/Development';
import { MeteorViteCompilerPlugin } from '@/internals/lib/MeteorViteCompilerPlugin';
import { CurrentConfig, resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';

export async function createDevCompilerPlugin() {
    const { mainModule, needsReactPreamble, config } = await resolveMeteorViteConfig({
        mode: 'development',
    }, 'serve');
    
    return new MeteorViteCompilerPlugin({
        outDir: '',
        assetsDir: '',
        mode: CurrentConfig.mode,
        boilerplate: new ViteDevelopmentBoilerplate({
            clientEntry: mainModule.vite.client.path,
            needsReactPreamble,
            baseUrl: config.base,
        }),
        dynamicAssetBoilerplate: false,
    })
}