import type { CopyConfig } from '@/buildConfig/defineBuildConfig';
import { createLogger } from '@/lib/createLogger';
import FS from 'fs/promises';
import Path from 'path';

type FileCopyOptions = {
    rootDir: string;
    name: string;
    copy: CopyConfig;
}

export async function copyFiles({ rootDir, name, copy }: FileCopyOptions) {
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