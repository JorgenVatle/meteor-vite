import { cacheBuildInfo } from '@/buildConfig/plugins/cacheBuildInfo';
import { copyFiles } from '@/buildConfig/plugins/copyFiles';
import Path from 'path';
import { defineConfig, type Options } from 'tsup';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';
import { EsbuildPluginMeteorStubs } from './plugins';

const DEFAULT_CONFIG = Object.freeze({
    target: 'es2022',
    sourcemap: true,
    dts: true,
    noExternal: ['meteor'],
    skipNodeModulesBundle: true,
    format: ['esm']
} satisfies Options);

export function defineBuildConfig(rootDir: string, _options: Config | Config[]): ReturnType<typeof defineConfig> {
    const optionList: Config[] = Array.isArray(_options) ? _options : [_options];
    
    return ({ watch }) => optionList.map((options, index) => {
        const config = mergeConfig(rootDir, options,
            {
                watch,
                outDir: Path.join(rootDir, options.outDir || 'dist'),
                tsconfig: options.tsconfig && Path.join(rootDir, options.tsconfig),
                esbuildPlugins: [
                    EsbuildPluginMeteorStubs,
                    ...options.esbuildPlugins || [],
                ],
                plugins: index + 1 === optionList.length
                         ? [cacheBuildInfo(rootDir)]
                         : undefined
            }
        );
        
        // Run cleanup on first build
        if (index === 0 && envFlag('TSUP_CLEAN')) {
            config.clean = options.clean ?? true;
        }
        
        if (watch) {
            config.clean = false;
        }
        
        if (Array.isArray(config.entry)) {
            config.entry = config.entry.map((entry) => Path.join(rootDir, entry));
        } else {
            const entries = Object.entries(config.entry).map(([key, path]) => {
                return [key, Path.join(rootDir, path)];
            });
            config.entry = Object.fromEntries(entries);
        }
        
        return config;
    });
}

interface CustomConfigFields extends Required<Pick<Options, 'name' | 'entry'>> {
    copy?: CopyConfig[]
}

export type CopyConfig = {
    from: string;
    to: string;
    type: 'file' | 'directory';
}

type _Options = Required<Options>;
export type TSUpPlugin = _Options['plugins'][number];
export type ESBuildPlugin = _Options['esbuildPlugins'][number];

export type Config = CustomConfigFields & Pick<Options, 'entry' | 'skipNodeModulesBundle' | 'sourcemap' | 'banner' | 'platform' | 'tsconfig' | 'format' | 'splitting' | 'dts' | 'clean' | 'onSuccess' | 'noExternal' | 'esbuildPlugins' | 'outDir'>;
type MergedConfig = Omit<CustomConfigFields & Options, keyof typeof DEFAULT_CONFIG> & typeof DEFAULT_CONFIG;

function mergeConfig(
    rootDir: string,
    options: Config,
    overrides: Options,
): MergedConfig {
    const config = Object.assign({ rootDir, ...DEFAULT_CONFIG }, {
        ...options,
        ...overrides,
    });
    
    Object.assign(config, {
        plugins: [
            overrides.plugins || [],
            copyFiles(rootDir, config),
        ].flat()
    });
    
    return config;
}