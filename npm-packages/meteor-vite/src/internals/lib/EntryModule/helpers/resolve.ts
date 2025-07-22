import { MeteorViteError } from '@/internals/error/MeteorViteError';
import {
    MeteorEntryModule,
    type MeteorMainModule,
    ViteEntryModule,
    type ViteMainModule,
} from '@/internals/lib/EntryModule';
import { setupEntryModules } from '@/internals/lib/EntryModule/helpers/setup';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import type { ProjectJson, ResolvedViteConfig, UserViteConfig } from '@/plugin';
import { documentationLink } from '@/utilities/common/Constants';
import { Colorize } from '@/utilities/server';
import Path from 'path';
import pc from 'picocolors';

export function resolveMainModules({ packageJson, userConfig, command }: { userConfig: UserViteConfig | ResolvedViteConfig, packageJson: ProjectJson, command: ResolvedViteConfig['command'] }) {
    const mainModulePath = packageJson.meteor.mainModule;
    const rootDir = CurrentConfig.projectRoot;
    
    if (!mainModulePath.server) {
        throw new MeteorViteError(`Could not find a ${Colorize.arch('server')} mainModule path in your package.json!`, {
            subtitle: `Visit ${pc.blue(documentationLink('packagejson'))} for more details`
        })
    }
    
    if (!mainModulePath.client) {
        throw new MeteorViteError(`Could not find a ${Colorize.arch('client')} mainModule path in your package.json!`, {
            subtitle: `Visit ${pc.blue(documentationLink('packagejson'))} for more details`
        })
    }
    
    if (!userConfig.meteor?.clientEntry) {
        throw new MeteorViteError('You need to specify a clientEntry in your Vite config file!', {
            subtitle: `Visit ${pc.blue(documentationLink('vite-config'))} for more details`
        });
    }
    
    const meteor: MeteorMainModule = {
        server: new MeteorEntryModule(Path.resolve(rootDir, mainModulePath.server), {
            location: 'app-source',
            context: 'server',
        }),
        client: new MeteorEntryModule(Path.resolve(rootDir, mainModulePath.client), {
            location: 'app-source',
            context: 'client',
        }),
    }
    
    const vite: ViteMainModule = {
        server: undefined,
        client: new ViteEntryModule(Path.resolve(rootDir, userConfig.meteor?.clientEntry)),
    };

    if (userConfig.meteor.serverEntry) {
        vite.server = new ViteEntryModule(Path.resolve(rootDir, userConfig.meteor.serverEntry));
    }
    
    const mainModules = setupEntryModules({
        vite,
        meteor,
    });
    
    if (command === 'build') {
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