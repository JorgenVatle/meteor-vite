import type { Config, CopyConfig, TSUpPlugin } from '@/buildConfig/defineBuildConfig';
import FS from 'fs/promises';
import Path from 'path';

export function copyFilesPlugin(rootDir: string, config: Config): TSUpPlugin {
    return {
        name: 'copy-files',
        async buildEnd() {
            const filesToCopy = config.copy;
            
            if (!filesToCopy) {
                this.logger.info('No files to copy')
                return;
            }
            
            await Promise.all(
                filesToCopy.map(async (copy) => {
                    await copyFiles({
                        rootDir,
                        name: config.name,
                        copy
                    });
                    
                    this.logger.info(`Copied ${copy.from} to ${copy.to}`);
                })
            );
        }
    }
}

type FileCopyOptions = {
    rootDir: string;
    name: string;
    copy: CopyConfig;
}

async function copyFiles({ rootDir, name, copy }: FileCopyOptions) {
    const srcPath = Path.join(rootDir, copy.from);
    const destPath = Path.join(rootDir, copy.to);
    
    await FS.mkdir(Path.dirname(destPath), { recursive: true });
    if (copy.type === 'directory') {
        await FS.cp(srcPath, destPath, { recursive: true });
    } else {
        await FS.copyFile(srcPath, destPath);
    }
}
