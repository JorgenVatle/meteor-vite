import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import Path from 'path';

export function internalEntryModule(): {
    development: {
        client: EntryModule;
        server: EntryModule;
    },
    production: {
        client: EntryModule;
        server: EntryModule;
    }
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

function entryModule({ environment, context }: ModuleInfo): EntryModule {
    const rootDir = Path.join(CurrentConfig.tempDir, context);
    const fileExtension = `${environment}.mjs`;
    
    return {
        meteor: Path.join(rootDir, `_entry-meteor.${fileExtension}`),
        vite: Path.join(rootDir, `_entry-vite.${fileExtension}`),
    }
}

type ModuleInfo = {
    environment: 'development' | 'production';
    context: 'client' | 'server';
}

type EntryModule = {
    meteor: string;
    vite: string;
}