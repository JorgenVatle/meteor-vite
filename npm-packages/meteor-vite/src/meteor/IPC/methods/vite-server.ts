import type { MeteorRuntimeConfig } from 'meteor/jorgenvatle:vite-bundler/utility/Helpers';
import { createServer, resolveConfig, type ResolvedServerUrls, ViteDevServer } from 'vite';
import { meteorWorker } from '../../../plugin/Meteor';
import Logger from '../../../utilities/Logger';
import { RefreshNeeded } from '../../../ViteLoadRequest';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../../../VitePluginSettings';
import { MeteorServerBuilder } from '../../ServerBuilder';
import { BackgroundWorker, type WorkerRuntimeConfig } from '../BackgroundWorker';
import { DDPConnection } from '../DDP';
import { defineIpcMethods } from '../interface';
import MeteorEvents from '../MeteorEvents';
import { IPC } from '../transports/Transport';

let viteDevServer: ViteDevServer & { config: ResolvedMeteorViteConfig };
let viteConfig: ResolvedMeteorViteConfig;
let listening = false;

export type ViteRuntimeConfig = {
    host?: string | boolean;
    port?: number;
    resolvedUrls?: ResolvedServerUrls,
    entryFile?: string
    backgroundWorker?: WorkerRuntimeConfig;
}
export interface DevServerOptions {
    packageJson: ProjectJson,
    meteorParentPid: number;
    meteorConfig: MeteorRuntimeConfig;
}

export default defineIpcMethods({
    async 'vite.server.getConfig'() {
        await sendViteConfig();
    },
    
    async 'vite.server.start'({ packageJson, meteorParentPid, meteorConfig }: DevServerOptions) {
        const ddpClient = DDPConnection.init(meteorConfig);
        const backgroundWorker = await BackgroundWorker.init(meteorParentPid, ddpClient);
        const Logger = ddpClient.logger;
        
        if (await backgroundWorker.hasActiveSibling()) {
            await IPC.reply({
                kind: 'viteConfig',
                data: backgroundWorker.config.viteConfig,
            })
            Logger.info(`Vite server running as background process. (pid ${backgroundWorker.config.pid})`);
            return process.exit(0);
        }
        
        const server = await createViteServer({
            packageJson,
            meteorConfig,
            refreshNeeded: () => {
                IPC.reply({
                    kind: 'refreshNeeded',
                    data: undefined,
                })
            },
            buildStart: () => {
                sendViteConfig().catch((error) => {
                    Logger.error(error);
                    process.exit(1);
                });
            },
        });
        
        if (!listening) {
            await server.listen();
            listening = true
            server.printUrls();
        }
        
        await sendViteConfig();
        return;
    },
})

async function createViteServer({
    packageJson,
    buildStart,
    refreshNeeded,
}: Omit<DevServerOptions, 'meteorParentPid'> & {
    buildStart: () => void;
    refreshNeeded: () => void;
}) {
    if (viteDevServer) {
        return viteDevServer;
    }
    
    viteConfig = await resolveConfig({
        mode: 'development',
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'serve');
    
    viteDevServer = await createServer({
        mode: 'development',
        configFile: viteConfig.configFile,
        plugins: [
            meteorWorker({
               meteorStubs: {
                   packageJson,
               }
            }),
            {
                name: 'meteor-handle-restart',
                buildStart,
            },
            {
                name: 'meteor-ipc-middleware',
                configureServer: (server) => {
                    server.middlewares.use('/__meteor__/ipc-message', (req, res, next) => {
                        let body = '';
                        req.on('data', (chunk) => {
                            body += chunk.toString();
                        });
                        req.on('end', () => {
                          const message = JSON.parse(body);
                          MeteorEvents.ingest(message);
                          res.statusCode = 204;
                          next();
                        })
                    })
                }
            }
        ],
    });
    
    if (viteConfig.meteor?.serverEntry) {
        await MeteorServerBuilder({ packageJson, watch: true });
    }
    
    process.on('warning', (warning) => {
        if (warning.name !== RefreshNeeded.name) {
            return;
        }
        refreshNeeded();
    })
    
    return viteDevServer;
}

async function sendViteConfig() {
    if (!viteDevServer) {
        Logger.debug('Tried to get config from Vite server before it has been created!');
        return;
    }
    
    const { config } = viteDevServer;
    const worker = BackgroundWorker.instance;
    
    await worker.setViteConfig({
        host: config.server?.host,
        port: config.server?.port,
        entryFile: config.meteor?.clientEntry,
        resolvedUrls: viteDevServer.resolvedUrls!,
    });
    
    await IPC.reply({
        kind: 'viteConfig',
        data: worker.config.viteConfig,
    });
    await IPC.reply({
        kind: 'workerConfig',
        data: {
            ...worker.config,
            listening,
        },
    })
}

