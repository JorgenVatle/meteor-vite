import Path from 'node:path';
import { getBuildConfig } from '../utility/Helpers';
import Logger from '../utility/Logger';

/**
 * Temporary file extension to apply to all files bundled by Vite.
 * This makes it easier to filter out any files that shouldn't be processed by our Meteor compiler plugin.
 */
export const BUNDLE_FILE_EXTENSION = '_vite-bundle.tmp'

const { viteOutSrcDir } = getBuildConfig();

export default class Compiler {
    protected static cleanupHandlers: CleanupHandler[] = [];
    
    public static addCleanupHandler(handler: CleanupHandler) {
        if (process.env.METEOR_VITE_BUILD_CLEANUP === 'false') {
            Logger.info('Build cleanup is disabled ⚠️ Recommended use is in CI/CD environments ⚠️ Your project\'s source files might be modified by meteor-vite.');
            return;
        }
        this.cleanupHandlers.push(handler);
        Logger.debug(`Added cleanup handler. Pending cleanups: ${this.cleanupHandlers.length}`, this.cleanupHandlers);
    }
    
    protected _formatFilename(nameOrPath: string) {
        return nameOrPath.replace(`.${BUNDLE_FILE_EXTENSION}`, '');
    }
    
    protected processFilesForTarget(files: BuildPluginFile[]) {
        files.forEach(file => {
            const fileMeta = {
                _original: {
                    basename: file.getBasename(),
                    path: file.getPathInPackage(),
                },
                basename: this._formatFilename(file.getBasename()),
                path: this._formatFilename(file.getPathInPackage()),
                relativePath: Path.relative(viteOutSrcDir, this._formatFilename(file.getPathInPackage())),
            }
            const sourcePath = file.getPathInPackage();
            
            Logger.debug(`[${file.getArch()}] Processing: ${fileMeta.basename}`, { fileMeta });
            
            file.addAsset({
                path: fileMeta.relativePath,
                data: file.getContentsAsBuffer(),
                sourcePath,
                cacheable: true,
            });
            file.cacheable = true;
        })
    }
    
    protected afterLink () {
        Compiler.cleanupHandlers.forEach((handle, index) => {
            Logger.debug(`Processing cleanup handler #${index}`)
            handle();
        });
        Compiler.cleanupHandlers = [];
    }
    
}
type CleanupHandler = () => void;
type PluginFileBuffer = ArrayBufferLike;
interface BuildPluginFile {
    getContentsAsString(): string;
    getPathInPackage(): string;
    getContentsAsBuffer(): PluginFileBuffer;
    getBasename(): string;
    addAsset(data: FileData): void;
    addStylesheet(data: FileData): void;
    addJavaScript(data: FileData): void;
    getArch(): string;
}
interface FileData {
    path: string;
    data: string | PluginFileBuffer;
    sourcePath?: string;
}