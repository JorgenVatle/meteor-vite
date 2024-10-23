import type { WorkerRuntimeConfig } from '../BackgroundWorker';
import type { IpcReplies } from '../Transport';
import BuildWorker from './build';
import ViteServerWorker, { type ViteRuntimeConfig } from './vite-server';

const IpcMethods = {
    ...ViteServerWorker,
    ...BuildWorker,
} as const;

export default IpcMethods;

export interface WorkerReplies {
    buildResult: {
        payload:
            | { success: false }
            | {
                  success: true;
                  outDir: string;
                  meteorViteConfig: any,
                  output?: { name?: string, type: string, fileName: string }[]
              };
    }
    viteConfig: ViteRuntimeConfig
    refreshNeeded: void,
    workerConfig: WorkerRuntimeConfig & { listening: boolean }
}

export type WorkerResponse<TName extends WorkerReplyKind = WorkerReplyKind> = {
    kind: TName,
    data: IpcReplies[TName]
};

export type WorkerMethod = { [key in keyof IPCMethods]: [name: key, method: IPCMethods[key]]
                           } extends {
                               [key: string]: [infer Name, infer Method]
                           } ? Name extends keyof IPCMethods
                               ? { method: Name, params: Parameters<IPCMethods[Name]> extends [infer Reply, ...infer Params]
                                                         ? Params
                                                         : [] }
                               : never
                             : never;

export type WorkerReplyKind = keyof WorkerReplies;

export type IPCMethods = typeof IpcMethods;
export type WorkerResponseData<Kind extends WorkerResponse['kind']> = Extract<WorkerResponse, { kind: Kind }>['data']
export type WorkerResponseHooks = {
    [key in WorkerResponse['kind']]: (data: WorkerResponseData<key>) => void;
}
