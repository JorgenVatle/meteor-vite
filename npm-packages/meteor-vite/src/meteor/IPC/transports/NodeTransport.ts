import type { WorkerResponse } from '../methods';
import { type IncomingMessageHandler, IpcTransport } from './Transport';

export class NodeTransport extends IpcTransport {
    protected process: NodeJS.Process = process;
    
    constructor() {
        super('NodeJS Process');
    }
    
    public get active() {
        return typeof this.process.send === 'function';
    }
    
    public listen(handler: IncomingMessageHandler) {
        process.on('message', (message: any) => handler(message));
    }
    
    public reply(message: WorkerResponse) {
        this.validateIpcChannel();
        return new Promise<void>((resolve, reject) => {
            this.process.send(message, undefined, undefined, (error) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        })
    }
    
    protected validateIpcChannel(): asserts this is { process: Required<Pick<NodeJS.Process, 'send'>> } {
        if (typeof process.send !== 'function') {
            throw new Error('Worker was not launched with an IPC channel!');
        }
    }
    
}