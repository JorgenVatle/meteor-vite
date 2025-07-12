import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { EntryModule } from '@/internals/lib/EntryModule';
import type { MainModule, ViteMainModule } from '@/internals/lib/internalEntryModule';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { setupEntryModules } from '@/internals/lib/setup/setupEntryModules';
import type { ProjectJson, ResolvedViteConfig } from '@/plugin';
import Path from 'path';

export function resolveMainModules({ packageJson, userConfig }: { userConfig: ResolvedViteConfig, packageJson: ProjectJson }) {
    const mainModulePath = packageJson.meteor.mainModule;
    const rootDir = CurrentConfig.projectRoot;
    
    if (!mainModulePath.server) {
        throw new MeteorViteError('package.json is missing a server mainModule. Make sure the meteor.mainModule.server field is set your package.json');
    }
    
    if (!userConfig.meteor?.clientEntry) {
        throw new MeteorViteError('You need to specify a clientEntry in your Vite config file!');
    }
    
    const meteor: MainModule = {
        server: new EntryModule(Path.resolve(rootDir, mainModulePath.server)),
        client: new EntryModule(Path.resolve(rootDir, mainModulePath.client)),
    }
    
    const vite: ViteMainModule = {
        server: undefined,
        client: new EntryModule(Path.resolve(rootDir, userConfig.meteor?.clientEntry)),
};

    if (userConfig.meteor.serverEntry) {
        vite.server = new EntryModule(Path.resolve(rootDir, userConfig.meteor.serverEntry));
    }
    
    const mainModules = setupEntryModules({
        vite,
        meteor,
    });
    
    if (userConfig.command === 'build') {
        return {
            vite: mainModules.vite.production,
            meteor: mainModules.meteor,
        }
    }
    
    return {
        vite: mainModules.vite.development,
        meteor: mainModules.meteor,
    }
}