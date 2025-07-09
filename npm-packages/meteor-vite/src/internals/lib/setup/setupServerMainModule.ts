import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { homepage } from '@/utilities/common';
import { hasModuleImport, Logger, moduleImport } from '@/utilities/server';
import FS from 'node:fs';
import Path from 'node:path';
import pc from 'picocolors';
import { writeToPathSync } from '../writeToPathSync';

export function setupServerMainModule({ meteorMainModule, viteMainModule }: {
    meteorMainModule: string | undefined,
    viteMainModule?: string | undefined;
}) {
    injectServerEntryImport(meteorMainModule);
    const importLines = [
        `import "meteor-vite/server-entry/production"`,
    ];
    
    if (viteMainModule) {
        importLines.push(
            moduleImport(Path.resolve(CurrentConfig.projectRoot, viteMainModule))
        )
    }
    
    writeToPathSync(CurrentConfig.serverProductionProxyModule, importLines.join('\n'));
    return CurrentConfig.serverProductionProxyModule;
}

/**
 * Add an import for the Vite-built server entry module to Meteor's configured mainModule.
 * This ensures that assets built by Vite will actually be loaded by the Meteor server after
 * creating a production build. Otherwise, the files emitted by Vite will be ignored by the
 * Meteor server.
 */
function injectServerEntryImport(mainModule: string | undefined) {
    if (!mainModule) {
        throw new MeteorViteError('Could not find a server mainModule path in your package.json!', {
            subtitle: `Visit ${pc.blue(homepage)} for more details`
        })
    }
    
    const originalContent = FS.readFileSync(mainModule, 'utf-8');
    const importPath = Path.relative(Path.dirname(mainModule), CurrentConfig.serverEntryModule);
    
    if (hasModuleImport({ content: originalContent, path: importPath })) {
        return;
    }
    
    Logger.warn(`Meteor-Vite needs to write to the Meteor main module defined in your package.json`);
    Logger.warn(`If you've migrated an existing project, please make sure to move any existing code in this file over to the entry module specified in your Vite config.`);
    
    
    FS.writeFileSync(mainModule, [
        `/**`,
        ` * These modules are automatically imported by jorgenvatle:vite.`,
        ` * You can commit these to your project or move them elsewhere if you'd like,`,
        ` * but they must be imported somewhere in your Meteor mainModule.`,
        ` *`,
        ` * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages`,
        ` **/`,
        moduleImport(importPath),
        '/** End of vite auto-imports **/',
        originalContent,
    ].join('\n'));
}

