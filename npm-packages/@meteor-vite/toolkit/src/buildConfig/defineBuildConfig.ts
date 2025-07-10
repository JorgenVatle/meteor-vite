import { copyFilesPlugin } from '@/buildConfig/copyFiles';
import { ProjectCompiler } from '@/ProjectCompiler';
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
    plugins: [] as TSUpPlugin[],
} satisfies Options);

export function defineBuildConfig(rootDir: string, _options: Config | Config[]): Options | Options[] {
    const optionList: Config[] = Array.isArray(_options) ? _options : [_options];
    const changes = new ProjectCompiler(rootDir);
    
    return optionList.map((options, index, array) => {
        const config = mergeConfig(rootDir, options,
            {
                outDir: Path.join(rootDir, options.outDir || 'dist'),
                tsconfig: options.tsconfig && Path.join(rootDir, options.tsconfig),
                esbuildPlugins: [
                    EsbuildPluginMeteorStubs,
                    ...options.esbuildPlugins || [],
                ]
            }
        );
        
        // Run cleanup on first build
        if (index === 0 && envFlag('TSUP_CLEAN')) {
            config.clean = options.clean ?? true;
        }
        
        config.plugins.push(
            copyFilesPlugin(rootDir, config)
        );
        
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

export type TSUpPlugin = Exclude<Options['plugins'], undefined>[number];

export type Config = CustomConfigFields & Pick<Options, 'entry' | 'skipNodeModulesBundle' | 'sourcemap' | 'banner' | 'platform' | 'tsconfig' | 'format' | 'splitting' | 'dts' | 'clean' | 'onSuccess' | 'noExternal' | 'esbuildPlugins' | 'outDir'>;
type MergedConfig = Omit<CustomConfigFields & Options, keyof typeof DEFAULT_CONFIG> & typeof DEFAULT_CONFIG;

function mergeConfig(
    rootDir: string,
    options: Config,
    overrides: Options
): MergedConfig {
    const defaults = Object.assign({ rootDir }, DEFAULT_CONFIG);
    return Object.assign(defaults, options, overrides);
}