import type * as Scripts from '@/internals/scripts';
import { Colorize, Logger } from '@/utilities/server';

export class ModuleRunner {
    constructor() {
        Logger.debug('Module Runner Initialized!', { url: import.meta.url });
    }
    
    public async runScript<TName extends ScriptName>(script: TName): Promise<ScriptResult<TName>> {
        Logger.debug(`Running script ${script} from meteor-vite/internals`);
        const scripts = await this.import('internals/scripts');
        return scripts[script]() as ScriptResult<TName>;
    }
    
    public import<T extends ImportPath>(importPath: T): ModuleImport<T> {
        Logger.debug(`Importing ${importPath} from meteor-vite`);
        
        if (!(importPath in AvailableModules)) {
            const vite = Colorize.packageName('jorgenvatle:vite');
            const meteorVite = Colorize.packageName('meteor-vite');
            throw new Error([
                `Meteor-Vite Module Runner: Could not find module: ${importPath}.`,
                '',
                `Available modules: ${Object.keys(AvailableModules).join(',')}.`,
                `Make sure ${meteorVite} and ${vite} are fully installed and up-to-date.`,
                `If you're seeing this error after updating ${meteorVite}, please open an issue over on GitHub.`
            ].join('\n'))
        }
        
        return AvailableModules[importPath]() as ModuleImport<T>;
    }
    
}

const AvailableModules = {
    'utilities/server': () => import('@/utilities/server/index'),
    'internals/scripts': () => import('@/internals/scripts/index'),
} as const;

type ScriptName = keyof typeof Scripts;
type ScriptResult<TName extends ScriptName> = Awaited<ReturnType<typeof Scripts[TName]>>;
type ImportPath = keyof AvailableModules;
type AvailableModules = typeof AvailableModules;
type ModuleImport<T extends ImportPath> = ReturnType<AvailableModules[T]>;