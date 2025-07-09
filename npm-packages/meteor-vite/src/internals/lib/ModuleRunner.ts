import type * as Scripts from '@/internals/scripts';

export class ModuleRunner {
    constructor() {}
    
    public runScript<TName extends ScriptName>(script: TName): Promise<Awaited<ScriptResult<TName>>> {
        console.debug(`Running script ${script} from meteor-vite/internals`);
        return import('@/internals/scripts/index').then((scripts: any): Awaited<ScriptResult<TName>> => {
            return scripts[script]();
        })
    }
    
    public import<T extends ImportPath>(importPath: T): ModuleImport<T> {
        console.debug(`Importing ${importPath} from meteor-vite`);
        return AvailableModules[importPath]() as ModuleImport<T>;
    }
    
}

const AvailableModules = {
    'utilities/server': () => import('@/utilities/server/index'),
    'internals/scripts': () => import('@/internals/scripts/index'),
} as const;

type ScriptName = keyof typeof Scripts;
type ScriptResult<TName extends ScriptName> = ReturnType<typeof Scripts[TName]>;
type ImportPath = keyof AvailableModules;
type AvailableModules = typeof AvailableModules;
type ModuleImport<T extends ImportPath> = ReturnType<AvailableModules[T]>;