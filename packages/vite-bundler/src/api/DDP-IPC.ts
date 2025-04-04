import type { WorkerMethod, WorkerResponse, WorkerResponseHooks } from 'meteor-vite';
import { getMeteorRuntimeConfig } from '../utility/Helpers';
import { IpcCollection } from './Collections';

type IpcResponse = WorkerResponse & { data: any }

export class DDP_IPC {
    constructor(public readonly responseHooks: Partial<WorkerResponseHooks>) {
        Meteor.methods({
            'meteor-vite:ipc': ({ kind, data }: IpcResponse) => {
                const hook = this.responseHooks[kind];
                
                if (typeof hook !== 'function') {
                    return console.warn('Meteor: Unrecognized worker message!', { message: { kind, data }});
                }
                
                return hook(data);
            },
            async 'meteor-vite:ipc.received'(id: string) {
                await IpcCollection.removeAsync(id)
            }
        });
        Meteor.publish('meteor-vite:ipc', function() {
            return IpcCollection.find();
        })
    }
    
    public call({ method, params, id }: WorkerMethod) {
        IpcCollection.insertAsync({
            id,
            method,
            params: JSON.stringify(params),
        }).catch((error: unknown) => {
            console.error('Vite: Failed to send IPC event!', error);
        })
    }
    
    public setResponseHooks(responseHooks: Partial<WorkerResponseHooks>) {
        Object.assign(this.responseHooks, responseHooks);
    }
    
    /**
     * Whether we are confident that Meteor can be reached over DDP from the current runtime config
     */
    public get active() {
        return !getMeteorRuntimeConfig().fallback
    }
}