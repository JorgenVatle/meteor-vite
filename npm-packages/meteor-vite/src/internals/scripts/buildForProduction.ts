import { ViteProductionBoilerplate } from '@/internals/boilerplate/Production';
import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { MeteorViteCompilerPlugin } from '@/internals/lib/MeteorViteCompilerPlugin';
import { CurrentConfig, resolveMeteorViteConfig } from '@/internals/lib/resolveMeteorViteConfig';
import type { ProjectJson, ResolvedViteConfig, StubSettings } from '@/plugin';

import { BuildLogger, Colorize, hasModuleImport, isSamePath, Logger, moduleImport } from '@/utilities/server';
import { execaSync } from 'execa';
import FS from 'fs';
import Path from 'node:path';
import pc from 'picocolors';
import type { RollupOutput, RollupWatcher } from 'rollup';
import { createBuilder, type InlineConfig, version } from 'vite';
import Instance from '../lib/MeteorViteRuntime';

export async function buildForProduction() {
    const { config, outDir, packageJson, assetsDir } = await resolveMeteorViteConfig({ mode: 'production' }, 'build');
    const { logger } = Instance;
    logger.info(`Building with Vite v${version}...`);
    
    if (!config.meteor?.clientEntry) {
        throw new MeteorViteError('No client entrypoint specified in Vite config!')
    }
    
    preparePackagesForExportAnalyzer({ 
        mainModule: packageJson.meteor.mainModule,
        replacePackages: packageJson.meteor.vite?.replacePackages || [],
    });
    // todo: refactor into environment config
    config.meteor.meteorStubs.meteor.buildProgramsPath = CurrentConfig.packageAnalyzer.buildProgramsDir;
    config.meteor.meteorStubs.meteor.isopackPath = CurrentConfig.packageAnalyzer.isopackPath;
    
    const builder = await createBuilder(config);
    const fileNames: Partial<Record<string, { filePath: string, originalFilePath: string, isEntry?: boolean }[]>> = {};
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
            if (environment.name === 'client') {
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
                    
                    if (environment.name === 'server') {
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
    
    fileNames['server']?.forEach((file) => {
        if (!file.originalFilePath.endsWith('js')) {
            return;
        }
        if (!file.isEntry) {
            return;
        }
        if (file.filePath.includes('entry-client')) {
            return;
        }
        
        const summary = addServerEntryImport(file);
        logger.debug('Added import to server entry', summary);
    });
    
    
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


function addServerEntryImport({ filePath }: {
    filePath: string,
}) {
    const { serverEntryModule } = CurrentConfig;
    const originalContent = FS.readFileSync(serverEntryModule, 'utf-8');
    const importPath = Path.relative(Path.dirname(serverEntryModule), filePath);
    
    if (hasModuleImport({ content: originalContent, path: importPath })) {
        return;
    }
    
    FS.writeFileSync(serverEntryModule, [moduleImport(importPath), originalContent].join('\n'));
    
    return {
        importPath,
        filePath,
        serverEntryModule,
    }
}


/**
 * Build a temporary Meteor project to generate package source files that
 * can be analyzed for package export stubbing.
 */
function preparePackagesForExportAnalyzer({ mainModule, replacePackages = [] }: {
    mainModule: { client: string },
    replacePackages?: PackageReplacement[];
}) {
    const inDir = CurrentConfig.packageAnalyzer.inDir;
    const outDir = CurrentConfig.packageAnalyzer.outDir;
    
    BuildLogger.info('Building packages to make them available to export analyzer...')
    BuildLogger.debug(`Destination dir: ${outDir}`);
    
    const startTime = Date.now();
    const filesToCopy = [
        Path.join('.meteor', '.finished-upgraders'),
        Path.join('.meteor', '.id'),
        Path.join('.meteor', 'packages'),
        Path.join('.meteor', 'platforms'),
        Path.join('.meteor', 'release'),
        Path.join('.meteor', 'versions'),
        Path.join('.meteor', 'local', 'resolver-result-cache.json'),
        'package.json',
        mainModule.client,
    ]
    const directoriesToCopy = [
        'node_modules',
        'packages',
    ];
    const replaceMeteorPackages: PackageReplacement[] = [
        { startsWith: 'standard-minifier', replaceWith: '' },
        { startsWith: 'refapp:meteor-typescript', replaceWith: 'typescript' },
        ...replacePackages,
    ]
    
    // Copy files from `.meteor`
    for (const file of filesToCopy) {
        const from = Path.join(CurrentConfig.projectRoot, file)
        const to = Path.join(inDir, file)
        FS.mkdirSync(Path.dirname(to), { recursive: true });
        try {
            FS.copyFileSync(from, to)
        } catch (error) {
            if (!(error instanceof Error) || !('code' in error)) {
                throw error;
            }
            if (error.code !== 'ENOENT') {
                throw error;
            }
            if (file.includes('.finished-upgraders')) {
                Logger.warn(`Could not copy ${Colorize.filepath(file)} from source project. Likely because you have a new Meteor project. Generally safe to ignore, only consequence may be that package export analysis may take a little longer if updates are necessary.`);
                continue;
            }
            throw error;
        }
    }
    
    // Symlink to source project's `packages` and `node_modules` folders
    for (const dir of directoriesToCopy) {
        const from = Path.join(CurrentConfig.projectRoot, dir);
        const to = Path.join(inDir, dir);
        
        if (!FS.existsSync(from)) continue;
        if (FS.existsSync(to)) continue;
        
        FS.symlinkSync(from, to);
    }
    
    // Remove/replace conflicting Atmosphere packages
    {
        const file = Path.join(inDir, '.meteor', 'packages')
        let content = FS.readFileSync(file, 'utf8')
        for (const pack of replaceMeteorPackages) {
            const lines = content.split('\n')
            content = lines.map(line => {
                if (!line.startsWith(pack.startsWith)) {
                    return line;
                }
                Logger.debug(`Removed from intermediary Meteor packages:\n L ${Colorize.textSnippet(line)}`);
                return pack.replaceWith || '';
            }).join('\n')
        }
        FS.writeFileSync(file, content)
    }
    // Remove server entry
    {
        const file = Path.join(inDir, 'package.json')
        const data = JSON.parse(FS.readFileSync(file, 'utf8'))
        data.meteor = {
            mainModule: {
                client: data.meteor.mainModule.client,
            },
        }
        FS.writeFileSync(file, JSON.stringify(data, null, 2))
    }
    // Only keep meteor and npm package imports to enable lazy packages
    {
        const file = Path.join(inDir, mainModule.client)
        const lines = FS.readFileSync(file, 'utf8').split('\n');
        const imports = lines.filter(line => {
            if (!line.startsWith('import')) return false;
            if (line.includes('meteor/')) {
                BuildLogger.debug('Keeping meteor import line:', line);
                return true;
            }
            if (!line.match(/["'`]\./)) {
                BuildLogger.debug('Keeping non-meteor import line', line);
                return true;
            }
            BuildLogger.debug('Stripped import line from intermediary build:', line);
            return false;
        })
        FS.writeFileSync(file, imports.join('\n'))
    }
    
    const METEOR_PACKAGE_DIRS = [
        Path.join(CurrentConfig.projectRoot, 'packages'),
    ]
    
    if (process.env.METEOR_PACKAGE_DIRS) {
        METEOR_PACKAGE_DIRS.push(Path.resolve(process.env.METEOR_PACKAGE_DIRS));
    }
    
    execaSync('meteor', [
        'build',
        outDir,
        '--directory',
        // Ensure the temporary build doesn't abort for projects with mobile builds
        // Since this is only a temporary build, it shouldn't impact the final production build for the developer.
        '--server=http://localhost:3000',
    ], {
        cwd: inDir,
        // stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            FORCE_COLOR: '3',
            VITE_METEOR_DISABLED: 'true',
            METEOR_PACKAGE_DIRS: METEOR_PACKAGE_DIRS.join(':'),
        },
    })
    
    BuildLogger.success(`Packages built in ${(Date.now() - startTime).toLocaleString()}ms`);
}

export interface BuildOptions {
    meteor: StubSettings['meteor'];
    packageJson: ProjectJson;
}

export type BuildResultChunk = { name?: string, type: string, fileName: string };
export type ParsedConfig = {
    viteConfig: ResolvedViteConfig;
    inlineBuildConfig: InlineConfig;
    outDir: string;
}
export type TransformedViteManifest = {
    base: string;
    assetsDir: string;
    files: Record<string, ViteManifestFile>;
}
type PackageReplacement = {
    startsWith: string;
    replaceWith: string;
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