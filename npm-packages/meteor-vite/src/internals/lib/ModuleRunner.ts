import * as Scripts from '@/internals/scripts';

type ScriptName = keyof typeof Scripts;
type ScriptResult<TName extends ScriptName> = ReturnType<typeof Scripts[TName]>;

export class ModuleRunner {
    constructor() {}
    
    public runScript<TName extends ScriptName>(script: TName): ScriptResult<TName> {
        return Scripts[script]() as ScriptResult<TName>;
    }
    
}
