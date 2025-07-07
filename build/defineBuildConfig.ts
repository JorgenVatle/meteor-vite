import { fileURLToPath } from 'node:url';
import Path from 'path';
import type { Options } from 'tsup';
import { EsbuildPluginMeteorStubs } from './tsup-plugins';

export function defineBuildConfig(options: Config): Options {
    const rootDir = inferConfigRootDir();
    const config = Object.assign({
        rootDir,
        target: 'es2022',
        sourcemap: true,
        dts: true,
        noExternal: ['meteor'],
        minify: false,
    }, options, {
        outDir: Path.join(rootDir, options.outDir || 'dist'),
        esbuildPlugins: [
            EsbuildPluginMeteorStubs,
            ...options.esbuildPlugins || [],
        ]
    } satisfies Options)
    
    if (Array.isArray(config.entry)) {
        config.entry = config.entry.map((entry) => Path.join(rootDir, entry));
    } else {
        const entries = Object.entries(config.entry).map(([key, path]) => {
            return [key, Path.join(rootDir, path)];
        });
        config.entry = Object.fromEntries(entries);
    }
    
    if (config.tsconfig) {
        config.tsconfig = Path.join(rootDir, config.tsconfig);
    }
    
    return config;
}

function inferConfigRootDir() {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    
    try {
        const err = new Error();
        Error.prepareStackTrace = (_, stack) => stack;
        const stack = err.stack as unknown as NodeJS.CallSite[];
        
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
type Config = RequiredConfigFields & Pick<Options, 'entry'  | 'platform' | 'tsconfig' | 'format' | 'splitting' | 'dts' | 'clean' | 'onSuccess' | 'noExternal' | 'esbuildPlugins' | 'outDir'>;