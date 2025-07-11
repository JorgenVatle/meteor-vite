import type { TSUpPlugin } from '@/buildConfig';
import { ProjectCompiler } from '@/ProjectCompiler';
import pc from 'picocolors';

export function cacheBuildInfo(rootDir: string): TSUpPlugin {
    const compiler = new ProjectCompiler(rootDir);
    let startTime = Date.now();
    return {
        name: 'Cache build info',
        async buildStart() {
            startTime = Date.now();
        },
        async buildEnd() {
            const { fileContentHash, fileNamesHash, fileContentCount, filenameCount, durationMs } = await compiler.saveBuildInfo({
                durationMs: Date.now() - startTime,
                timestamp: Date.now(),
            });
            this.logger.info(`Hash info:`, pc.bold(`Hashed files in`), pc.yellow(`${durationMs}ms`));
            this.logger.info('Output hash:', pc.bold(`${filenameCount} files`), '|', fileNamesHash,);
            this.logger.info('Input hash:', pc.bold(`${fileContentCount} files`), '|', fileContentHash,);
        }
    }
}