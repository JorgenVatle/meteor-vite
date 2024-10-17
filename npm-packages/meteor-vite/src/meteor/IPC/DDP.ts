import type { DataStreamDocument } from 'meteor/jorgenvatle:vite-bundler/api/Collections';
import type { MeteorViteMethods } from 'meteor/jorgenvatle:vite-bundler/api/Endpoints';
import type { MeteorRuntimeConfig } from 'meteor/jorgenvatle:vite-bundler/utility/Helpers';
import SimpleDDP, { DDPMessage } from 'simpleddp';
import type { ddpSubscription } from 'simpleddp/classes/ddpSubscription';
import { inspect } from 'util';
import WS from 'ws';
import { createLabelledLogger } from '../../utilities/Logger';
import type { WorkerMethod } from './methods';

export class DDPConnection {
    protected readonly client: SimpleDDP;
    protected _logger = createLabelledLogger('DDPConnection');
    public logger: DDPLogger;
    protected readonly _status = {
        lastConnectionTimestamp: Date.now(),
        connected: false,
        pingCount: 0,
        timedOut: false,
    }
    protected static instance?: DDPConnection;
    
    public static get() {
        if (this.instance) {
            return this.instance;
        }
        const { host, port } = this.getMeteorRuntimeConfig();
        this.instance = new DDPConnection({
            endpoint: `ws://${host}:${port}/websocket`,
        });
        return this.instance;
    }
    
    protected static getMeteorRuntimeConfig(): MeteorRuntimeConfig {
        if (!process.env.METEOR_RUNTIME) {
            throw new Error('[MeteorViteWorker] Missing required METEOR_RUNTIME environment variable!');
        }
        return JSON.parse(process.env.METEOR_RUNTIME)
    }
    
    protected ipcSubscription?: ddpSubscription;
    
    public onIpcCall(handler: (message: WorkerMethod) => Promise<void>) {
        if (!this.ipcSubscription) {
            this.ipcSubscription = this.client.subscribe('meteor-vite:ipc');
        }
        
        this.client.on<DDPMessage.Added<WorkerMethod>>('added', (data) => {
            if (data.collection !== '_meteor-vite.ipc') {
                return;
            }
            handler(data.fields).catch((error) => {
                this.logger.error('Failed to handle IPC request', data.fields, error)
            });
        })
    }
    
    protected constructor(config: {
        endpoint: string;
    }) {
        this.client = new SimpleDDP({
            endpoint: config.endpoint,
            SocketConstructor: WS,
            reconnectInterval: 1000,
        });
        
        this.logger = new DDPLogger(this);
        
        // @ts-expect-error Bad typings
        this.client.on('error', (error: unknown) => {
            this._logger.error('DDP Error', { error: String(error) });
        });
        this.client.on('connected', () => {
            this._logger.info(`Connected to DDP server`, config);
        });
        this.client.on('disconnected', () => {
            this._logger.info(`Disconnected from DDP server`,  config);
        });
        
        setInterval(() => {
            this.logger.debug(`Ping #${this.status.pingCount++}`);
        }, 10_000);
    }
    
    public async call<TMethod extends keyof MeteorViteMethods>(method: TMethod, ...params: Parameters<MeteorViteMethods[TMethod]>) {
        return this.client.call(method, ...params);
    }
    
    public get status() {
        const TIMEOUT_MS = 30_000;
        const connected = this._status.connected = this.client.connected;
        
        if (connected) {
            this._status.lastConnectionTimestamp = Date.now();
        }
        
        if (Date.now() - this._status.lastConnectionTimestamp > TIMEOUT_MS) {
            this._status.timedOut = true;
        }
        
        return this._status;
    }
}

declare module 'simpleddp' {
    
    export namespace DDPMessage {
        interface Added<TFields extends Record<string, unknown> = Record<string, unknown>> {
            msg: 'added';
            collection: string;
            id: string;
            fields: TFields;
        }
    }
    
    export default interface simpleDDP {
        on<TEvent extends DDPMessage.Added>(event: 'added', handler: (data: TEvent) => void): void;
    }
}

class DDPLogger {
    protected readonly _logger = createLabelledLogger('DDPLogger');
    constructor(protected readonly ddp: DDPConnection) {
    }
    
    protected log(log: Pick<DataStreamDocument, 'level' | 'message'>) {
        this.ddp.call('meteor-vite:log', {
            type: 'log:server',
            ...log,
            sender: 'vite-dev-server',
        }).catch((error) => {
            this._logger.error('Failed to log message through DDP', error);
        });
        if (!this.ddp.status.connected) {
            console.log(`⚡ (DDP Connection Lost) [${log.level}] ${log.message}`);
        }
    }
    
    protected formatMessage(message: string, args: unknown[]) {
        return [message, ...args.map((data) => {
            return inspect(data, { depth: 2, colors: true });
        })].join(' ');
    }
    
    public info(message: string, ...args: unknown[]) {
        this.log({ level: 'info', message: this.formatMessage(message, args) });
    }
    
    public error(message: string, ...args: unknown[]) {
        this.log({ level: 'error', message: this.formatMessage(message, args) });
    }
    
    public success(message: string, ...args: unknown[]) {
        this.log({ level: 'success', message: this.formatMessage(message, args) });
    }
    
    public debug(message: string, ...args: unknown[]) {
        if (!process.env.ENABLE_DEBUG_LOGS) {
            return;
        }
        this.log({ level: 'debug', message: this.formatMessage(message, args) });
    }
    
    public warn(message: string, ...args: unknown[]) {
        this.log({ level: 'warn', message: this.formatMessage(message, args) });
    }
}