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
            this.logger.info('Build Info', 'Cache build info');
            await compiler.saveBuildInfo({
                durationMs: Date.now() - startTime,
                timestamp: Date.now(),
            });
        }
    }
}