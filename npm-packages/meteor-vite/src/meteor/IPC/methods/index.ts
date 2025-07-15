import type { WorkerRuntimeConfig } from '../BackgroundWorker';
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
    startSSRWatcher: { serverEntry: string }
}

export type WorkerResponse<TName extends WorkerReplyKind = WorkerReplyKind> = {
    kind: TName,
    data: WorkerReplies[TName]
};

export type WorkerMethod = {
    [key in keyof IPCMethods]: {
        id: string;
        method: key;
        params: Parameters<IPCMethods[key]>
    }
}[keyof IPCMethods];


export type WorkerReplyKind = keyof WorkerReplies;

export type IPCMethods = typeof IpcMethods;
export type WorkerResponseData<Kind extends WorkerResponse['kind']> = Extract<WorkerResponse, { kind: Kind }>['data']
export type WorkerResponseHooks = {
    [key in WorkerResponse['kind']]: (data: WorkerResponseData<key>) => void;
}
