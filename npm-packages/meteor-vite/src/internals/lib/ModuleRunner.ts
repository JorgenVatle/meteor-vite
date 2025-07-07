import type * as Scripts from '@/internals/scripts';

export class ModuleRunner {
    constructor() {}
    
    public runScript<TName extends ScriptName>(script: TName): Promise<Awaited<ScriptResult<TName>>> {
        console.debug(`Running script ${script} from meteor-vite/internals`);
        return import('@/internals/scripts/index').then((scripts: any): Awaited<ScriptResult<TName>> => {
            return scripts[script]();
        })
    }
    
    public import<T extends ImportPath>(module: T): Promise<AvailableImports[T]> {
        console.debug(`Importing ${module} from meteor-vite`);
        return import((`meteor-vite/${module}`));
    }
    
}

type ScriptName = keyof typeof Scripts;
type ScriptResult<TName extends ScriptName> = ReturnType<typeof Scripts[TName]>;
type ImportPath = keyof AvailableImports;

interface AvailableImports {
    'utilities/server': typeof import('@/utilities/server/index'),
}
