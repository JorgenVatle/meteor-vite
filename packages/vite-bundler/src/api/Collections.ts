import type { WorkerMethod } from 'meteor-vite';
import { Mongo } from 'meteor/mongo';
import type { RuntimeConfig } from '../loading/vite-connection-handler';

export const StatusCollection = new Mongo.Collection<StatusDocument>('_meteor-vite.status', { connection: null });
export const DataStreamCollection = new Mongo.Collection<DataStreamDocument>('_meteor-vite.data-stream');
export const IpcCollection = new Mongo.Collection<IpcDocument>('_meteor-vite.ipc', { connection: null });

export interface BaseDocument {
    createdAt: Date;
    updatedAt?: Date;
}

export interface StatusDocument<TStatus extends keyof MeteorViteStatus = keyof MeteorViteStatus> extends BaseDocument {
    type: TStatus,
    data: MeteorViteStatus[TStatus];
    appId: string;
}

interface MeteorViteStatus {
    viteConfig: RuntimeConfig;
    viteWorker: {
        pid: number;
        meteorPid: number;
        meteorParentPid: number;
        lastHeartbeat: Date;
        startedAt: Date;
    }
}

interface IpcDocument<TMethod extends WorkerMethod = WorkerMethod> {
    method: TMethod['method']
    params: TMethod['params'];
}

export type DataStreamLogType = 'log:client' | 'log:server' | 'log:shared';
export type DataStreamLogLevels = 'info' | 'debug' | 'error' | 'success' | 'warn';

export interface DataStreamDocument extends BaseDocument {
    type: DataStreamLogType;
    level: DataStreamLogLevels;
    message: string;
    sender?: string;
}