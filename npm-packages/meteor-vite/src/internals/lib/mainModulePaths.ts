import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import Path from 'path';

export function mainModulePaths(environment: ModuleInfo['environment']): {
    client: MainModule;
    server: MainModule;
} {
    return {
        client: mainModule({ environment, context: 'client' }),
        server: mainModule({ environment, context: 'server'})
    }
}

function mainModule({ environment, context }: ModuleInfo): MainModule {
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

type MainModule = {
    meteor: string;
    vite: string;
}