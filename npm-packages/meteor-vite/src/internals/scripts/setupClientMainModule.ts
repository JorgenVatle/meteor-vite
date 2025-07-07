import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { writeToPathSync } from '@/internals/lib/writeToPathSync';
import { moduleImport } from '@/utilities/server';
import Path from 'node:path';
import pc from 'picocolors';
import type { ModulePreloadOptions } from 'vite';

export function setupClientMainModule({ viteMainModule, modulePreload }: {
    viteMainModule: string;
    modulePreload?: boolean | ModulePreloadOptions | undefined;
}) {
    const importLines = [];
    let polyfill = true;
    
    if (modulePreload === false) {
        polyfill = false;
    }
    
    if (typeof modulePreload === 'object' && modulePreload.polyfill === false) {
        polyfill = false;
    }
    
    if (polyfill) {
        importLines.push(`import "vite/modulepreload-polyfill"`);
    }
    
    if (viteMainModule) {
        importLines.push(
            moduleImport(Path.resolve(CurrentConfig.projectRoot, viteMainModule)),
        );
    }
    
    if (!CurrentConfig.clientEntryModule) {
        console.warn(new Error(`Missing client entry module! Maybe jorgenvatle:vite is out of date?\n Try updating it: $ ${pc.yellow(
            'meteor update jorgenvatle:vite')}`));
        return viteMainModule;
    }
    
    writeToPathSync(CurrentConfig.clientEntryModule, importLines.join('\n'));
    return CurrentConfig.clientEntryModule;
}