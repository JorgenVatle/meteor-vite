import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { EntryModule } from '@/internals/lib/EntryModule';
import type { MainModule } from '@/internals/lib/internalEntryModule';
import { setupMainModules } from '@/internals/lib/setup/setupMainModules';
import type { ProjectJson, ResolvedViteConfig } from '@/plugin';

export function resolveMainModules({ packageJson, userConfig }: { userConfig: ResolvedViteConfig, packageJson: ProjectJson }) {
    const mainModulePath = packageJson.meteor.mainModule;
    
    if (!mainModulePath.server) {
        throw new MeteorViteError('package.json is missing a server mainModule. Make sure the meteor.mainModule.server field is set your package.json');
    }
    
    const meteor: MainModule = {
        server: new EntryModule(mainModulePath.server),
        client: new EntryModule(mainModulePath.client),
    }
    
    const vite: MainModule = {
        server: new EntryModule(userConfig.meteor?.serverEntry),
        client: new EntryModule(userConfig.meteor?.clientEntry),
    };
    
    const mainModules = setupMainModules({
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