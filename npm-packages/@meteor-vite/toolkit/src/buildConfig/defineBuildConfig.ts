import { copyFiles } from '@/buildConfig/copyFiles';
import { ProjectCompiler } from '@/ProjectCompiler';
import Path from 'path';
import { defineConfig, type Options } from 'tsup';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';
import { EsbuildPluginMeteorStubs } from '../Plugins';

export function defineBuildConfig(rootDir: string, _options: Config | Config[]): Options | Options[] {
    const optionList: Config[] = Array.isArray(_options) ? _options : [_options];
    const changes = new ProjectCompiler(rootDir);
    
    return optionList.map((options, index, array) => {
        const config = Object.assign({ rootDir }, defineConfig({
            target: 'es2022',
            sourcemap: true,
            dts: true,
            noExternal: ['meteor'],
            skipNodeModulesBundle: true,
        }), options, {
            outDir: Path.join(rootDir, options.outDir || 'dist'),
            tsconfig: options.tsconfig && Path.join(rootDir, options.tsconfig),
            esbuildPlugins: [
                EsbuildPluginMeteorStubs,
                ...options.esbuildPlugins || [],
            ]
        } satisfies Options);
        
        // Run cleanup on first build
        if (index === 0 && envFlag('TSUP_CLEAN')) {
            config.clean = options.clean ?? true;
        }
        
        const filesToCopy = config.copy;
        if (filesToCopy) {
            config.onSuccess = async () => {
                await Promise.all(
                    filesToCopy.map((copy) => copyFiles({
                        rootDir,
                        name: config.name,
                        copy
                    }))
                );
                if (typeof config.onSuccess === 'function') {
                    await config.onSuccess();
                }
            }
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

export type Config = CustomConfigFields & Pick<Options, 'entry' | 'skipNodeModulesBundle' | 'sourcemap' | 'banner' | 'platform' | 'tsconfig' | 'format' | 'splitting' | 'dts' | 'clean' | 'onSuccess' | 'noExternal' | 'esbuildPlugins' | 'outDir'>;