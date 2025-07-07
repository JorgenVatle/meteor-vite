import type { Options } from 'tsup';
import { EsbuildPluginMeteorStubs } from './tsup-plugins';

export function defineBuildConfig(config: Config): Options {
    return Object.assign({
        target: 'es2022',
        sourcemap: true,
        dts: true,
        noExternal: ['meteor'],
        minify: false,
    }, config, {
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
            ...config.esbuildPlugins,
        ]
    } satisfies Options)
}

type RequiredConfigFields = Required<Pick<Options, 'name' | 'entry'>>;
type Config = RequiredConfigFields & Pick<Options, 'entry'  | 'platform' | 'format' | 'dts' | 'clean' | 'onSuccess' | 'esbuildPlugins'>;