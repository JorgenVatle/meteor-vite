import type { WorkerMethod, WorkerResponse, WorkerResponseHooks } from 'meteor-vite';
import { IpcCollection } from './Collections';

type IpcResponse = WorkerResponse & { data: any }

export class DDP_IPC {
    constructor(protected readonly responseHooks: Partial<WorkerResponseHooks>) {
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
    
    public call(method: WorkerMethod) {
        IpcCollection.insertAsync(method).catch((error) => {
            console.error('Vite: Failed to send IPC event!', error);
        })
    }
    
    public setResponseHooks(responseHooks: Partial<WorkerResponseHooks>) {
        Object.assign(this.responseHooks, responseHooks);
    }
}