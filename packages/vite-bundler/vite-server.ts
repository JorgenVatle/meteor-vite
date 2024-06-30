import FS from 'fs';
import type HTTP from 'http';
import { fetch } from 'meteor/fetch';
import { Meteor } from 'meteor/meteor';
import { WebAppInternals, WebApp } from 'meteor/webapp';
import Path from 'path';
import {
    DevConnectionLog,
    getConfig,
    MeteorViteConfig,
    setConfig,
    ViteConnection,
    ViteDevScripts,
} from './loading/vite-connection-handler';
import { createWorkerFork, cwd, getProjectPackageJson, isMeteorIPCMessage } from './workers';
interface MeteorProgramManifest {
    path: string;
}

type ViteManifest = Record<string, ViteChunk>;
interface ViteChunk {
    file: string;
    src: string;
    name?: string;
    isDynamicEntry?: boolean;
    isEntry?: boolean;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
}

function getViteManifest(): ViteManifest {
    if (Meteor.settings.vite?.manifest) {
        return Meteor.settings.vite.manifest;
    }
    const viteManifestInfo = WebApp.clientPrograms['web.browser'].manifest.find(({ path }: MeteorProgramManifest) => path.endsWith('manifest.json'));
    if (!viteManifestInfo) {
        throw new Error('Could not find Vite manifest in Meteor client program manifest');
    }
    const viteManifestPath = Path.join(cwd, 'programs', 'web.browser', viteManifestInfo.path);
    const manifest = JSON.parse(FS.readFileSync(viteManifestPath, 'utf8'));
    return Meteor.settings.vite = { manifest };
}

interface ManifestImports {
    stylesheets: string[];
    modules: string[];
    modulePreload: string[];
}

function parseManifestImports(manifest: ViteManifest): ManifestImports {
    const stylesheets: string[] = [];
    const modules: string[] = [];
    const modulePreload: string[] = [];
    
    function preloadImports(imports: string[]) {
        for (const path of imports) {
            const chunk = manifest[path];
            if (!chunk) {
                continue;
            }
            modulePreload.push(chunk.file);
            stylesheets.push(...chunk.css || []);
            preloadImports(chunk.imports || []);
        }
        
    }
    
    for (const [name, chunk] of Object.entries(manifest)) {
        if (!chunk.isEntry) {
            continue;
        }
        
        if (chunk.file.endsWith('.js')) {
            modules.push(chunk.file);
        }
        
        if (chunk.file.endsWith('.css')) {
            stylesheets.push(chunk.file);
        }
        
        preloadImports(chunk.imports || []);
    }
    
    return {
        stylesheets,
        modules,
        modulePreload,
    }
}

function importsToHtml(imports: ManifestImports) {
    const lines = [];
    
    for (const file of imports.stylesheets) {
        lines.push(`<link rel="stylesheet" href="${file}">`);
    }
    
    for (const file of imports.modules) {
        lines.push(`<script type="module" src="${file}"></script>`);
    }
    
    for (const file of imports.modulePreload) {
        lines.push(`<link rel="modulepreload" href="${file}">`);
    }
    
    return lines.join('\n');
}

if (Meteor.isProduction) {
    Meteor.startup(() => {
        const manifest = getViteManifest();
        const imports = parseManifestImports(manifest);
        const html = importsToHtml(imports);
        
        WebAppInternals.registerBoilerplateDataCallback('meteor-vite', async (request: HTTP.IncomingMessage, data: BoilerplateData) => {
            data.dynamicBody = `${data.dynamicBody || ''}\n${html}`;
        });
    });
}

if (Meteor.isDevelopment) {
    let tsupWatcherRunning = false;
    DevConnectionLog.info('Starting Vite server...');
    
    WebAppInternals.registerBoilerplateDataCallback('meteor-vite', async (request: HTTP.IncomingMessage, data: BoilerplateData) => {
        const scripts = new ViteDevScripts(await getConfig());
        data.dynamicBody = `${data.dynamicBody || ''}\n${await scripts.stringTemplate()}`;
    });
    
    const viteServer = createWorkerFork({
        async viteConfig(config) {
            const { ready } = await setConfig(config);
            if (ready) {
                DevConnectionLog.info(`Meteor-Vite ready for connections!`)
            }
        },
        refreshNeeded() {
            DevConnectionLog.info('Some lazy-loaded packages were imported, please refresh')
        },
        
        /**
         * Builds the 'meteor-vite' npm package where the worker and Vite server is kept.
         * Primarily to ease the testing process for the Vite plugin.
         */
        workerConfig({ listening }) {
            if (!listening) return;
            if (process.env.METEOR_VITE_TSUP_BUILD_WATCHER !== 'true') return;
            if (tsupWatcherRunning) return;
            
            tsupWatcherRunning = true;
            viteServer.call({
                method: 'tsup.watch.meteor-vite',
                params: [],
            })
        }
    }, { detached: true });
    
    viteServer.call({
        method: 'vite.server.start',
        params: [{
            packageJson: getProjectPackageJson(),
            meteorParentPid: process.ppid,
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
        }).catch((error) => {
            console.error(error);
        })
    })
    
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
    })
}

interface BoilerplateData {
    dynamicBody?: string;
    additionalStaticJs: [contents: string, pathname: string][];
    inline?: string;
}
