import type { Scripts as BootstrapScripts } from 'meteor-vite/internals';
import { constants, Script } from 'node:vm';
import { CurrentConfig } from './CurrentConfig';

export function runBootstrapScript<
    TScript extends keyof typeof BootstrapScripts
>(script: TScript): Promise<Awaited<ReturnType<typeof BootstrapScripts[TScript]>>> {
    return new Script(`import('meteor-vite/internals').then(({ Scripts }) => Scripts.${script}())`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext()
}

export function getUtils(): Promise<typeof import('meteor-vite/utilities/server')> {
    return new Script(`import('meteor-vite/utilities/server')`, {
        filename: CurrentConfig.bootstrapEvalFilename,
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
    }).runInThisContext();
}