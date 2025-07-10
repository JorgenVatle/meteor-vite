import { fileURLToPath } from 'node:url';
import Path from 'path';
import { defineConfig, type Options } from 'tsup';
import { envFlag } from '../npm-packages/meteor-vite/src/utilities/server/EnvFlag';
import { EsbuildPluginMeteorStubs } from './tsup-plugins';

export function defineBuildConfig(rootDir: string, _options: Config | Config[]): Options | Options[] {
    const optionList: Config[] = Array.isArray(_options) ? _options : [_options];
    
    return optionList.map((options, index) => {
        const config = Object.assign({ rootDir }, defineConfig({
            target: 'es2022',
            sourcemap: true,
            dts: true,
            noExternal: ['meteor'],
        }), options, {
            outDir: Path.join(rootDir, options.outDir || 'dist'),
            tsconfig: options.tsconfig && Path.join(rootDir, options.tsconfig),
            esbuildPlugins: [
                EsbuildPluginMeteorStubs,
                ...options.esbuildPlugins || [],
            ]
        } satisfies Options);
        
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

function inferConfigRootDir() {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    
    try {
        const err = new Error();
        Error.prepareStackTrace = (_, stack) => stack;
        const stack = err.stack as unknown as NodeJS.CallSite[];
        console.log(stack.map((frame) => frame.getFileName()))
        
        // Skip frames until we find one that's not in this file
        for (let i = 1; i < stack.length; i++) {
            const fileName = stack[i].getFileName();
            if (fileName && fileName !== __filename) {
                return Path.dirname(fileURLToPath(fileName));
            }
        }
    } finally {
        Error.prepareStackTrace = originalPrepareStackTrace;
    }
    throw new Error('Unable to infer root directory for build config definition');
}

type RequiredConfigFields = Required<Pick<Options, 'name' | 'entry'>>;
type Config = RequiredConfigFields & Pick<Options, 'entry' | 'sourcemap' | 'platform' | 'tsconfig' | 'format' | 'splitting' | 'dts' | 'clean' | 'onSuccess' | 'noExternal' | 'esbuildPlugins' | 'outDir'>;