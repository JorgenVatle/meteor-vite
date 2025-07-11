import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import Path from 'path';

export function internalEntryModule(environment: ModuleInfo['environment']): {
    client: EntryModule;
    server: EntryModule;
} {
    return {
        client: entryModule({ environment, context: 'client' }),
        server: entryModule({ environment, context: 'server'})
    }
}

function entryModule({ environment, context }: ModuleInfo): EntryModule {
    const rootDir = Path.join(CurrentConfig.tempDir, context);
    const fileExtension = `${environment}.mjs`;
    
    return {
        meteor: Path.join(rootDir, 'meteor', `_entry.${fileExtension}`),
        vite: Path.join(rootDir, 'vite', `_entry.${fileExtension}`),
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