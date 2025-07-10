import type { Config, CopyConfig, TSUpPlugin } from '@/buildConfig/defineBuildConfig';
import FS from 'fs/promises';
import Path from 'path';

export function copyFilesPlugin(rootDir: string, config: Config): TSUpPlugin {
    return {
        name: 'copy-files',
        async buildEnd() {
            const filesToCopy = config.copy;
            
            if (!filesToCopy) {
                return;
            }
            
            await Promise.all(
                filesToCopy.map(async (copy) => {
                    this.logger.info(`Copy ${copy.type}:`, `${copy.from} -> ${copy.to}`);
                    
                    await copyFiles({
                        rootDir,
                        copy
                    });
                })
            );
        }
    }
}

type FileCopyOptions = {
    rootDir: string;
    copy: CopyConfig;
}

async function copyFiles({ rootDir, copy }: FileCopyOptions) {
    const srcPath = Path.join(rootDir, copy.from);
    const destPath = Path.join(rootDir, copy.to);
    
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
}
