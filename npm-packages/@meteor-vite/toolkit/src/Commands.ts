import { Changes } from '@/Changes';

export const Commands = [
    {
        name: 'build-if-changed',
        description: 'Run the build script if the current root directory has seen changes since last build.',
        handler: async (rootDir) => {
            const changes = new Changes(rootDir);
            await changes.buildIfChanged();
        }
    },
    {
        name: 'check-changes',
        description: 'Check if the current root directory has seen changes since last build.',
        handler: async (rootDir) => {
            const changes = new Changes(rootDir, {
                detailedLogging: true,
                saveBuildHash: false,
            });
            await changes.checkChanges();
        }
    }
] satisfies CommandSpec[];

type CommandSpec = {
    name: string;
    description: string;
    handler: (rootDir: string) => Promise<void>;
}