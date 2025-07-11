import { EntryModule } from '@/internals/lib/EntryModule';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import Path from 'path';

export function internalEntryModule(): {
    development: MainModule,
    production: MainModule,
} {
    return {
        development: {
            client: entryModule({ environment: 'development', context: 'client' }),
            server: entryModule({ environment: 'development', context: 'server'})
        },
        production: {
            client: entryModule({ environment: 'production', context: 'client' }),
            server: entryModule({ environment: 'production', context: 'server'}),
        }
    }
}

function entryModule({ environment, context }: ModuleInfo): Entrypoint {
    const rootDir = Path.join(CurrentConfig.tempDir, context);
    const fileExtension = `${environment}.mjs`;
    
    return {
        meteor: new EntryModule(Path.join(rootDir, `_entry-meteor.${fileExtension}`)),
        vite: new EntryModule(Path.join(rootDir, `_entry-vite.${fileExtension}`)),
    }
}

type ModuleInfo = {
    environment: 'development' | 'production';
    context: 'client' | 'server';
}

type Entrypoint = {
    meteor: EntryModule;
    vite: EntryModule;
}

export type MainModule = {
    client: Entrypoint;
    server: Entrypoint;
}