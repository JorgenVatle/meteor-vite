import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { EntryModule } from '@/internals/lib/EntryModule';
import type { MainModule, ViteMainModule } from '@/internals/lib/internalEntryModule';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { setupEntryModules } from '@/internals/lib/setup/setupEntryModules';
import type { ProjectJson, ResolvedViteConfig } from '@/plugin';
import { documentationLink } from '@/utilities/common/Constants';
import Path from 'path';
import pc from 'picocolors';

export function resolveMainModules({ packageJson, userConfig }: { userConfig: ResolvedViteConfig, packageJson: ProjectJson }) {
    const mainModulePath = packageJson.meteor.mainModule;
    const rootDir = CurrentConfig.projectRoot;
    
    if (!mainModulePath.server) {
        throw new MeteorViteError('Could not find a server mainModule path in your package.json!', {
            subtitle: `Visit ${pc.blue(documentationLink('packagejson'))} for more details`
        })
    }
    
    if (!userConfig.meteor?.clientEntry) {
        throw new MeteorViteError('You need to specify a clientEntry in your Vite config file!', {
            subtitle: `Visit ${pc.blue(documentationLink('vite-config'))} for more details`
        });
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