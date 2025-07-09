import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { Colorize, ViteBundleLogger as Logger } from '@/utilities/server';
import type { InputFile } from 'meteor/isobuild';
import FS from 'node:fs';
import Path from 'path';
import { ViteBoilerplate } from '../boilerplate/Boilerplate';

export class MeteorViteCompilerPlugin {
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