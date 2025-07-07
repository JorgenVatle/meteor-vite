import { type ModuleRunner as InternalModuleRunner } from 'meteor-vite/src/internals';
import { constants, Script } from 'node:vm';
import { CurrentConfig } from './CurrentConfig';

export const ModuleRunner: InternalModuleRunner = await new Script(`import('meteor-vite/internals').then(({ ModuleRunner }) => new ModuleRunner())`, {
    filename: CurrentConfig.bootstrapEvalFilename,
    importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
}).runInThisContext();
