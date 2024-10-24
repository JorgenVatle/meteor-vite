import { fetch } from 'meteor/fetch';
import { Meteor } from 'meteor/meteor';
import { DDP_IPC } from '../api/DDP-IPC';
import {
    DevConnectionLog,
    getConfig,
    MeteorViteConfig,
    setConfig,
    ViteConnection, ViteDevScripts,
} from '../loading/vite-connection-handler';
import { getMeteorRuntimeConfig } from '../utility/Helpers';
import { createWorkerFork, getProjectPackageJson, isMeteorIPCMessage, type WorkerInstance } from '../workers';
import { type Boilerplate, ViteBoilerplate } from './common';


export class ViteDevServerWorker extends ViteBoilerplate {
    protected readonly viteServer: WorkerInstance;
    constructor() {
        super();
        const ipc = new DDP_IPC({
            async viteConfig(config) {
                const { ready } = await setConfig(config);
                if (ready) {
                    DevConnectionLog.info(`Meteor-Vite ready for connections!`)
                }
            },
            
            refreshNeeded() {
                DevConnectionLog.info('Some lazy-loaded packages were imported, please refresh')
            },
        })
        const viteServer = this.viteServer = createWorkerFork({
            viteConfig: ipc.responseHooks.viteConfig,
            refreshNeeded: ipc.responseHooks.refreshNeeded,
        }, { detached: true, ipc });
        
        Meteor.publish(ViteConnection.publication, () => {
            return MeteorViteConfig.find(ViteConnection.configSelector);
        });
        
        Meteor.methods({
            [ViteConnection.methods.refreshConfig]() {
                DevConnectionLog.info('Refreshing configuration from Vite dev server...')
                viteServer.call({
                    method: 'vite.server.getConfig',
                    params: [],
                });
                return getConfig();
            }
        });
    }
    
    public start() {
        DevConnectionLog.info('Starting Vite server...');
        
        this.viteServer.call({
            method: 'vite.server.start',
            params: [{
                packageJson: getProjectPackageJson(),
                meteorParentPid: process.ppid,
                meteorConfig: getMeteorRuntimeConfig(),
            }]
        });
        
        // Forward IPC messages from the `meteor-tool` parent process to the Vite server
        // Used to notify our Vite build plugin of things like the client bundle or Atmosphere packages being rebuilt.
        process.on('message', async (message) => {
            if (!isMeteorIPCMessage(message)) return;
            const { baseUrl, ready } = await getConfig();
            if (!ready) return;
            
            await fetch(`${baseUrl}/__meteor__/ipc-message`, {
                method: 'POST',
                body: JSON.stringify(message),
            }).catch((error: unknown) => {
                console.error(error);
            })
        })
    }
    
    public async getBoilerplate(): Promise<Boilerplate> {
        const scripts = new ViteDevScripts(await getConfig());
        
        return {
            dynamicBody: await scripts.stringTemplate(),
        }
    }
}