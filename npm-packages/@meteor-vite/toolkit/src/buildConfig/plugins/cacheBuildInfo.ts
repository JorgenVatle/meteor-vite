import type { TSUpPlugin } from '@/buildConfig';
import { ProjectCompiler } from '@/ProjectCompiler';
import pc from 'picocolors';

export function cacheBuildInfo(rootDir: string): TSUpPlugin {
    const compiler = new ProjectCompiler({
        rootDir,
        summary: false,
    });
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
            this.logger.info('Build info:', pc.bold(`${filenameCount} output files:`), pc.yellow(fileNamesHash));
            this.logger.info('Build info:', pc.bold(`${fileContentCount} source files:`), pc.yellow(fileContentHash),);
            this.logger.info(`Build info:`, pc.bold(`Hashing duration:`), pc.yellow(`${durationMs}ms`));
        }
    }
}