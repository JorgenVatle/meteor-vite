import { InternalEntryModule, type InternalMainModule } from '@/internals/lib/EntryModule/InternalEntryModule';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import Path from 'path';

export function getInternalModules(): InternalModules {
    return {
        vite: {
            development: viteEntryModule('development'),
            production: viteEntryModule('production'),
        },
        meteor: meteorEntryModule(),
        buildOutput: buildOutputEntryModule(),
    }
}

function meteorEntryModule(): InternalMainModule {
    return {
        client: new InternalEntryModule(Path.join(CurrentConfig.tempDir, 'client', `_entry-meteor.mjs`)),
        server: new InternalEntryModule(Path.join(CurrentConfig.tempDir, 'server', `_entry-meteor.mjs`)),
    }
}

function viteEntryModule(environment: 'development' | 'production'): InternalMainModule {
    return {
        client: new InternalEntryModule(Path.join(CurrentConfig.tempDir, 'client', `_entry-vite.${environment}.mjs`)),
        server: new InternalEntryModule(Path.join(CurrentConfig.tempDir, 'server', `_entry-vite.${environment}.mjs`)),
    }
}

function buildOutputEntryModule(): InternalMainModule {
    return {
        client: new InternalEntryModule(Path.join(CurrentConfig.outDir, 'client', `_entry-build.mjs`)),
        server: new InternalEntryModule(Path.join(CurrentConfig.outDir, 'server', `_entry-build.mjs`)),
    }
}

type InternalModules = {
    vite: {
        development: InternalMainModule,
        production: InternalMainModule,
    },
    meteor: InternalMainModule;
    buildOutput: InternalMainModule,
}