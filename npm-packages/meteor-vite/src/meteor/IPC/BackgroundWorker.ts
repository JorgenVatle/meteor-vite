import FS from 'fs/promises';
import Path from 'path';
import Logger from '../../utilities/Logger';
import { wait } from '../package/AutoImportQueue';
import type { DDPConnection } from './DDP';
import type { ViteRuntimeConfig } from './methods/vite-server';
import { PROCESS_TIMEOUT } from './transports/Transport';

export type WorkerRuntimeConfig = {
    pid: number;
    meteorPid: number;
    meteorParentPid: number;
    viteConfig: ViteRuntimeConfig;
}

export class BackgroundWorker {
    public static instance: BackgroundWorker;
    protected static readonly configPath = process.env.BACKGROUND_WORKER_PID_PATH || Path.join(
        '.meteor',
        'local',
        'vite',
        'vite-dev-server.pid',
    );
    
    public static async init(meteorParentPid: number, ddpClient: DDPConnection) {
        if (BackgroundWorker.instance) {
            return BackgroundWorker.instance;
        }
        const myConfig = {
            pid: process.pid,
            meteorPid: process.ppid,
            meteorParentPid,
            viteConfig: {},
        };
        try {
            await FS.mkdir(Path.dirname(this.configPath), { recursive: true });
            const content = await FS.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(content);
            BackgroundWorker.instance = new BackgroundWorker(config, ddpClient);
        } catch (error) {
            BackgroundWorker.instance = new BackgroundWorker(myConfig, ddpClient);
        }
        
        const worker = BackgroundWorker.instance;
        if (!worker.isRunning) {
            await worker.update(myConfig);
            worker._watchForParentExit();
        } else {
            ddpClient.logger.debug(`Background worker should be running with PID: ${worker.config.pid}`, worker.config);
        }
        return worker;
    }
    
    protected logger: DDPConnection['logger'];
    
    constructor(public config: WorkerRuntimeConfig, protected ddpClient: DDPConnection) {
        this.logger = ddpClient.logger;
    }
    
    protected exit() {
        this.logger.info('[Background Worker] Shutting down...');
        this.update({
            pid: 0,
            meteorPid: 0,
            meteorParentPid: 0,
            viteConfig: {},
        }).then(() => {
            process.exit(1);
        });
    }
    
    protected _watchForParentExit() {
        // Keep track of Meteor's parent process to exit if it has ended abruptly.
        setInterval(() => {
            // Exit when Meteor's parent process (meteor-tool) exits
            if (!this._isRunning(this.config.meteorParentPid)) {
                this.logger.warn('Meteor parent process is no longer running!');
                this.exit();
            }
        }, 1_000);
    }
    
    public async hasActiveSibling() {
        if (!this.isRunning) {
            return false;
        }
        
        await wait(PROCESS_TIMEOUT + 150);
        
        return this.isRunning;
    }
    
    protected _isRunning(pid: number) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    public get isRunning() {
        if (!this.config.pid) {
            this.logger.debug('No background worker process ID');
            return false;
        }
        if (this.config.pid === process.pid) {
            this.logger.debug(`Background worker's process ID is identical to ours`);
            return false;
        }
        if (!this._isRunning(this.config.pid)) {
            this.logger.debug(`Background worker not running: ${this.config.pid} (current PID ${process.pid}) `);
            return false;
        }
        return true;
    }
    
    public async update(config: WorkerRuntimeConfig) {
        this.config = config;
        await FS.writeFile(BackgroundWorker.configPath, JSON.stringify(this.config));
    }
    
    public async setViteConfig(viteConfig: WorkerRuntimeConfig['viteConfig']) {
        if (this.config.pid !== process.pid && this.isRunning) {
            this.logger.debug(`Skipping Vite config write - config is controlled by different background process: ${this.config.pid}`);
            return;
        }
        await this.update({
            ...this.config,
            viteConfig,
        });
    }
}