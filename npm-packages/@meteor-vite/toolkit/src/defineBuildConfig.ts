import { createLogger } from '@/lib/createLogger';
import { ProjectCompiler } from '@/ProjectCompiler';
import FS from 'fs/promises';
import { fileURLToPath } from 'node:url';
import Path from 'path';
import { defineConfig, type Options } from 'tsup';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';
import { EsbuildPluginMeteorStubs } from './Plugins';

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

interface CustomConfigFields extends Required<Pick<Options, 'name' | 'entry'>> {
    copy?: CopyConfig[]
}

type CopyConfig = {
    from: string;
    to: string;
    type: 'file' | 'directory';
}

type FileCopyOptions = {
    rootDir: string;
    name: string;
    copy: CopyConfig;
}

async function copyFiles({ rootDir, name, copy }: FileCopyOptions) {
    const logger = createLogger(name);
    const srcPath = Path.join(rootDir, copy.from);
    const destPath = Path.join(rootDir, copy.to);
    
    await FS.mkdir(Path.dirname(destPath), { recursive: true });
    if (copy.type === 'directory') {
        await FS.cp(srcPath, destPath, { recursive: true });
    } else {
        await FS.copyFile(srcPath, destPath);
    }
    
    logger.info(`Copied ${srcPath} to ${destPath}`);
}

type Config = CustomConfigFields & Pick<Options, 'entry' | 'skipNodeModulesBundle' | 'sourcemap' | 'banner' | 'platform' | 'tsconfig' | 'format' | 'splitting' | 'dts' | 'clean' | 'onSuccess' | 'noExternal' | 'esbuildPlugins' | 'outDir'>;