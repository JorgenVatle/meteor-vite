import type * as Scripts from '@/internals/scripts';

type ScriptName = keyof typeof Scripts;
type ScriptResult<TName extends ScriptName> = ReturnType<typeof Scripts[TName]>;

export class ModuleRunner {
    constructor() {}
    
    public runScript<TName extends ScriptName>(script: TName) {
        return import('@/internals/scripts/index').then((scripts: any): Awaited<ScriptResult<TName>> => {
            return scripts[script]();
        })
    }
    
}
