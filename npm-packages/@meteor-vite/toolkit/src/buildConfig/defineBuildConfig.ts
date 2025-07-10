import { copyFiles } from '@/buildConfig/plugins/copyFiles';
import Path from 'path';
import { type Options } from 'tsup';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';
import { EsbuildPluginMeteorStubs } from '../Plugins';

const DEFAULT_CONFIG = Object.freeze({
    target: 'es2022',
    sourcemap: true,
    dts: true,
    noExternal: ['meteor'],
    skipNodeModulesBundle: true,
} satisfies Options);

export function defineBuildConfig(rootDir: string, _options: Config | Config[]): Options | Options[] {
    const optionList: Config[] = Array.isArray(_options) ? _options : [_options];
    
    return optionList.map((options, index) => {
        const config = mergeConfig(rootDir, options,
            {
                outDir: Path.join(rootDir, options.outDir || 'dist'),
                tsconfig: options.tsconfig && Path.join(rootDir, options.tsconfig),
                esbuildPlugins: [
                    EsbuildPluginMeteorStubs,
                    ...options.esbuildPlugins || [],
                ],
            }
        );
        
        // Run cleanup on first build
        if (index === 0 && envFlag('TSUP_CLEAN')) {
            config.clean = options.clean ?? true;
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
    overrides: Options
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