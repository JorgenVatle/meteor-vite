import { type ModuleRunner as InternalModuleRunner } from 'meteor-vite/internals';
import { pathToFileURL } from 'node:url';
import { constants, Script } from 'node:vm';
import { CurrentConfig } from './CurrentConfig';

// language=javascript
const script = `
    import('meteor-vite/internals').then(({ ModuleRunner }) => {
        return new ModuleRunner();
    })
`

export const ModuleRunner: InternalModuleRunner = await new Script(
    script,
    {
        filename: pathToFileURL(CurrentConfig.bootstrapEvalFilename).href,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    },
).runInThisContext();
