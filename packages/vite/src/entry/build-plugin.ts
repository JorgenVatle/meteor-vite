import type { ViteBoilerplate } from 'meteor-vite/internals';
import { Colorize } from 'meteor-vite/utilities';
import type { InputFile } from 'meteor/isobuild';
import { Plugin } from 'meteor/isobuild';
import FS from 'node:fs';
import Path from 'path';
import { runBootstrapScript } from '../util/Bootstrap';
import { CurrentConfig } from '../util/CurrentConfig';
import Logger from '../util/Logger';
import { parseMeteorCliArgs } from '../util/parseMeteorCliArgs';

class CompilerPlugin {
    protected boilerplateArc = new Set<string>();
    constructor(public readonly config: {
        outDir: string,
        assetsDir: string,
        mode: 'production' | 'development' | string,
        boilerplate: ViteBoilerplate;
        dynamicAssetBoilerplate: boolean | undefined;
    }) {
        Logger.info(`[${config.mode}] Initializing Vite Compiler Plugin...`);
    }
    processFilesForTarget(files: InputFile[]) {
        this.boilerplateArc.clear();
        files.forEach(file => {
            const fileMeta = {
                _original: {
                    basename: file.getBasename(),
                    path: file.getPathInPackage(),
                },
                basename: this._formatFilename(file.getBasename()),
                path: Path.join(this.config.assetsDir, Path.relative(this.config.outDir, this._formatFilename(file.getPathInPackage()))),
                arch: file.getArch(),
            }
            
            Logger.debug(`[${Colorize.arch(file.getArch())}] Processing: ${fileMeta.basename}`, Colorize.object({ fileMeta }));
            
            if (!this.config.dynamicAssetBoilerplate) {
                this.addHtmlBoilerplate(file);
            }
            
            if (this.config.mode !== 'production') {
                return;
            }
            
            if (fileMeta.arch.startsWith('os') && fileMeta.basename.endsWith('.entry.js')) {
                file.addJavaScript({
                    path: fileMeta.path,
                    data: file.getContentsAsString(),
                    sourceMap: this._sourcemap(file),
                });
                Logger.debug(`Added ${Colorize.fileType('JavaScript')} to ${Colorize.arch(fileMeta.arch)}: ${fileMeta.basename}`);
                return;
            }
            
            file.addAsset({
                path: fileMeta.path,
                data: file.getContentsAsBuffer(),
            });
        })
    }
    
    protected addHtmlBoilerplate(file: InputFile) {
        const arch = file.getArch();
        if (!arch.includes('web')) {
            Logger.debug(`Skipping boilerplate injection for arch '${Colorize.arch(arch)}'`)
            return;
        }
        if (this.config.dynamicAssetBoilerplate && !arch.includes('cordova')) {
            Logger.debug(`Skipping boilerplate injection. Static asset boilerplate is disabled. ${Colorize.filepath(file.getPathInPackage())}`)
            return;
        }
        if (this.boilerplateArc.has(arch)) {
            return;
        }
        if (file.getPathInPackage().includes('node_modules')) {
            Logger.debug(`Skipping boilerplate injection for ${Colorize.filepath(file.getPathInPackage())} as it is not part of the project`);
            return;
        }
        
        const { dynamicHead, dynamicBody } = this.config.boilerplate.getBoilerplate(file.getArch());
        
        if (dynamicHead) {
            file.addHtml({
                data: dynamicHead,
                section: 'head',
            })
        }
        if (dynamicBody) {
            file.addHtml({
                data: dynamicBody,
                section: 'body',
            })
        }
        
        this.boilerplateArc.add(arch);
        Logger.debug(`[${Colorize.arch(arch)}] Added boilerplate to application HTML`, Colorize.object({ dynamicBody, dynamicHead }));
    }
    
    protected _formatFilename(nameOrPath: string) {
        return nameOrPath.replace(`.${CurrentConfig.bundleFileExtension}`, '');
    }
    
    protected _sourcemap(file: InputFile) {
        const filename = this._formatFilename(file.getPathInPackage()) + `.map`;
        const path = Path.resolve(CurrentConfig.projectRoot, filename);
        if (!FS.existsSync(path)) {
            Logger.warn(`Could not resolve source map for ${Colorize.filepath(filename)}`);
            return;
        }
        return FS.readFileSync(path, 'utf8')
    }
}

const { useBuildPlugin } = parseMeteorCliArgs();

if (!useBuildPlugin) {
    Logger.warn('Skipping initialization of Meteor-Vite build plugin');
} else {
    
    // Cleanup temporary files from previous builds.
    const cleanup = runBootstrapScript('setupProject');
   
    // todo: Verify Meteor packages file to warn users if there are active incompatible plugins.
    //  The standard-minifier plugins strip out sources that the export analyzer depends on, so
    //  with these plugins installed, builds will always fail.
    
    if (CurrentConfig.mode === 'production') {
        Plugin.registerCompiler({
            filenames: [],
            extensions: [CurrentConfig.bundleFileExtension]
        }, async () => {
            try {
                await cleanup;
                const { outDir, assetsDir, boilerplate, dynamicAssetBoilerplate } = await runBootstrapScript('buildForProduction');
                
                return new CompilerPlugin({
                    outDir,
                    assetsDir,
                    mode: CurrentConfig.mode,
                    boilerplate,
                    dynamicAssetBoilerplate,
                });
            } catch (error) {
                Logger.error('build failed');
                console.error(error);
                throw error;
            }
        });
    } else {
        const filenames: string[] = [
            'vite.config.ts',
            'vite.config.js',
            'vite.config.mts',
            'vite.config.mjs',
        ]
        try {
            const json = await runBootstrapScript('parsePackageJson');
            if (json.meteor?.vite?.configFile) {
                filenames.push(json.meteor.vite.configFile);
                Logger.info(`Using custom Vite config file path: ${json.meteor.vite.configFile}`);
            }
        } catch (error: any) {
            Logger.error(error, `Failed to resolve package.json contents. If you're using a custom Vite config file path, either use the default one or try to see why the package.json file is unavailable.`)
        }
        
        Plugin.registerCompiler({
            filenames,
            extensions: [],
        }, async () => {
            const boilerplate = await runBootstrapScript('prepareDevServerBoilerplate');
            return new CompilerPlugin({
                outDir: '',
                assetsDir: '',
                mode: CurrentConfig.mode,
                boilerplate,
                dynamicAssetBoilerplate: false,
            });
        })
    }
    
   await cleanup;
}

