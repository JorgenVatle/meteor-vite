import type * as BootstrapScripts from 'meteor-vite/bootstrap/scripts';
import { createJiti } from 'jiti';
import { CurrentConfig } from './CurrentConfig';

const jiti = createJiti(CurrentConfig.bootstrapEvalFilename);

export async function runBootstrapScript<
    TScript extends keyof typeof BootstrapScripts
>(script: TScript): Promise<Awaited<ReturnType<typeof BootstrapScripts[TScript]>>> {
    const scripts: any = await jiti.import('meteor-vite/bootstrap/scripts');
    
    return scripts[script]();
}