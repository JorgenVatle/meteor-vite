import { ViteProductionBoilerplate } from '@/internals/boilerplate/Production';
import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { getInternalModules } from '@/internals/lib/EntryModule/helpers/get';
import { MeteorViteCompilerPlugin } from '@/internals/lib/MeteorViteCompilerPlugin';
import { CurrentConfig, resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { ViteEnvironmentName } from '@/utilities/common';

import { BuildLogger, Colorize, isSamePath } from '@/utilities/server';
import FS from 'fs';
import Path from 'node:path';
import pc from 'picocolors';
import type { RollupOutput, RollupWatcher } from 'rollup';
import { createBuilder, version } from 'vite';
import Instance from '../lib/MeteorViteRuntime';

type ContextKey = 'client' | 'server' | (string & {});
type FileNames = {
    [context in ContextKey]?: { filePath: string, originalFilePath: string, isEntry?: boolean }[]
}

export async function createProductionCompilerPlugin() {
    try {
        return await createCompiler();
    } catch (error) {
        BuildLogger.error('build failed');
        throw error;
    }
}

async function createCompiler() {
    const { config, outDir, assetsDir } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    const { logger } = Instance;
    logger.info(`Building with Vite v${version}...`);
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    const builder = await createBuilder({
        configFile: config.configFile,
    });
    const fileNames: FileNames = {};
    const internalEntry = getInternalModules().buildOutput;
    
    let clientManifest = {};
    
    for (const [context, environment] of Object.entries(builder.environments)) {
        if (context.toLowerCase() === 'ssr') {
            continue;
        }
        
        logger.info(`Preparing ${Colorize.arch(context)} bundle...`);
        const list = fileNames[context] || [];
        
        try {
            const result = normalizeBuildOutput(
                await builder.build(environment)
            );
            
            fileNames[context] = list;
            if (environment.name === ViteEnvironmentName.client) {
                const baseAssetPath = `/${assetsDir.replace(/^\/+/g, '')}`;
                const baseCdnPath = environment.config.base;
                
                logger.info(`Vite assets will be fetched from ${Colorize.filepath(baseCdnPath)}`);
                logger.info(`Meteor will serve these assets from ${Colorize.filepath(baseAssetPath)}`);
                
                if (!isSamePath(baseAssetPath, baseCdnPath)) {
                    logger.warn('The root directory for your Vite bundle appears to be different from your Vite base path');
                    logger.warn(`Make sure you have a CDN or proxy configured to serve Meteor assets from ${Colorize.filepath(baseCdnPath)} -> ${Colorize.filepath(baseAssetPath)}`);
                    logger.warn(`If you're not using a CDN or proxy, just remove the 'base' field in your ${Colorize.filepath('vite.config.ts')} file`);
                }
            }
            
            result.forEach(({ output }) => {
                output.forEach((chunk) => {
                    const originalFilePath = Path.resolve(environment.config.build.outDir, chunk.fileName);
                    const ext = `.${CurrentConfig.bundleFileExtension}`;
                    let filePath = originalFilePath + ext;
                    
                    if (environment.name === ViteEnvironmentName.server) {
                        filePath = originalFilePath;
                    }
                    
                    if (filePath.includes('client.manifest.json') && 'source' in chunk) {
                        clientManifest = JSON.parse(chunk.source.toString());
                    }
                    
                    if ('isEntry' in chunk) {
                        list.push({ filePath, originalFilePath, isEntry: chunk.isEntry });
                    }
                    
                    // Appending our own temporary file extension on output files
                    // to help Meteor identify files to be processed by our compiler plugin.
                    if (originalFilePath.endsWith('map')) {
                        if (config.meteor.exposeSourceMaps !== true) {
                            return;
                        }
                    }
                    FS.renameSync(originalFilePath, filePath);
                    logger.debug(`Renamed file: ${filePath.replace(ext, pc.yellow(ext))}`);
                });
            });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
    
    fileNames[ViteEnvironmentName.server]?.forEach((file) => {
        if (!file.originalFilePath.endsWith('js')) {
            return;
        }
        if (!file.isEntry) {
            return;
        }
        // Client assets are intentionally left available to the server bundle.
        if (file.filePath.includes('entry-client')) {
            // Client entry modules don't need explicit imports as those are
            // be handled entirely through links added to the app's HTML
            // boilerplate
            return;
        }
        
        internalEntry.server.addImport({
            path: file.filePath,
        })
        logger.debug(`Added import for Vite server bundle to internal output entry module (${internalEntry.server.path})`, {
            path: file.filePath,
        });
    });
    
    internalEntry.server.appendMissing();
    
    return new MeteorViteCompilerPlugin({
        outDir,
        assetsDir,
        mode: CurrentConfig.mode,
        dynamicAssetBoilerplate: config.meteor.dynamicAssetBoilerplate,
        boilerplate: new ViteProductionBoilerplate({
            base: config.base,
            assetsDir,
            files: clientManifest,
        }),
    });
}

function normalizeBuildOutput(output:  RollupOutput | RollupOutput[] | RollupWatcher): RollupOutput[] {
    if ('close' in output) {
        throw new MeteorViteError('Seems like build result yielded a watcher instance.', {
            subtitle: `Make sure you don't have a hardcoded 'watch' setting defined in your Vite config.`
        });
    }
    
    if (Array.isArray(output)) {
        return output;
    }
    
    return [output];
}


export type TransformedViteManifest = {
    base: string;
    assetsDir: string;
    files: Record<string, ViteManifestFile>;
}
export type ViteManifestFile = {
    file: string;
    src: string;
    name?: string;
    isDynamicEntry?: boolean;
    isEntry?: boolean;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
}