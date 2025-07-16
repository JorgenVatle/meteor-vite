import type { Config, TSUpPlugin } from '@/buildConfig/defineBuildConfig';
import { Highlight } from '@/lib/Highlight';
import FS from 'fs/promises';
import Path from 'path';

export function copyFiles(rootDir: string, config: Config): TSUpPlugin {
    return {
        name: 'copy-files',
        async buildEnd() {
            const filesToCopy = config.copy;
            
            if (!filesToCopy) {
                return;
            }
            
            await Promise.all(
                filesToCopy.map(async (copy) => {
                    const srcPath = Path.join(rootDir, copy.from);
                    const destPath = Path.join(rootDir, copy.to);
                    
                    this.logger.info(`Copy:`, copy.from, '->', copy.to, Highlight.fileType(`(${copy.type})`));
                    
                    await FS.access(srcPath).catch((error) => {
                        throw new Error(`Could not locate source file: ${srcPath}`);
                    });
                    await FS.mkdir(Path.dirname(destPath), { recursive: true });
                    
                    switch (copy.type) {
                        case 'directory':
                            await FS.cp(srcPath, destPath, { recursive: true });
                            return;
                        case 'file':
                            await FS.copyFile(srcPath, destPath);
                            return;
                    }
                    
                    throw new Error(`Unknown copy type: ${copy.type}`);
                })
            );
        }
    }
}
