import { EntryModule } from '@/internals/lib/EntryModule';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import Path from 'path';

export const internalEntryModule = (): InternalModules => {
    return {
        vite: {
            development: viteEntryModule('development'),
            production: viteEntryModule('production'),
        },
        meteor: meteorEntryModule(),
        buildOutput: buildOutputEntryModule(),
    }
}

function meteorEntryModule(): MainModule {
    return {
        client: new EntryModule(Path.join(CurrentConfig.tempDir, 'client', `_entry-meteor.mjs`)),
        server: new EntryModule(Path.join(CurrentConfig.tempDir, 'server', `_entry-meteor.mjs`)),
    }
}

function viteEntryModule(environment: 'development' | 'production'): MainModule {
    return {
        client: new EntryModule(Path.join(CurrentConfig.tempDir, 'client', `_entry-vite.${environment}.mjs`)),
        server: new EntryModule(Path.join(CurrentConfig.tempDir, 'server', `_entry-vite.${environment}.mjs`)),
    }
}

function buildOutputEntryModule(): MainModule {
    return {
        client: new EntryModule(Path.join(CurrentConfig.outDir, 'client', `_entry-build.mjs`)),
        server: new EntryModule(Path.join(CurrentConfig.outDir, 'server', `_entry-build.mjs`)),
    }
}

type InternalModules = {
    vite: {
        development: MainModule,
        production: MainModule,
    },
    meteor: MainModule;
    buildOutput: MainModule;
}

export type MainModule = {
    client: EntryModule;
    server: EntryModule;
}

export type ViteMainModule = {
    client: EntryModule,
    server?: EntryModule,
};