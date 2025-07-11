import type { TSUpPlugin } from '@/buildConfig';
import { ProjectCompiler } from '@/ProjectCompiler';

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
            this.logger.info('Output hash:', fileNamesHash, `(${filenameCount} files)`);
            this.logger.info('Input hash:', fileContentHash, `(${fileContentCount} files)`);
            this.logger.info(`Hash duration:`, `${durationMs}ms`);
        }
    }
}