import { WorkerResponseData } from 'meteor-vite';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import '../api/Endpoints';
import { getProjectPackageJson } from '../workers';

export type RuntimeConfig = WorkerResponseData<'viteConfig'> & { ready: boolean, lastUpdate: number, baseUrl: string };
export let MeteorViteConfig: Mongo.Collection<RuntimeConfig>;
export const VITE_ENTRYPOINT_SCRIPT_ID = 'meteor-vite-entrypoint-script';
export const VITE_CLIENT_SCRIPT_ID = 'meteor-vite-client';
export class ViteDevScripts {
    public readonly urls;
    public readonly needsReactPreamble: boolean;
    constructor(public readonly config: RuntimeConfig) {
        const { baseUrl } = config;
        
        this.urls = {
            baseUrl,
            entrypointUrl: `${baseUrl}/${config.entryFile}`,
            viteClientUrl: `${baseUrl}/@vite/client`,
            reactRefresh: `${baseUrl}/@react-refresh`,
        }
        
        /**
         * Determine whether to inject React Refresh snippet into HTML served by Meteor.
         * Without this snippet, React HMR will not work with Meteor-Vite.
         *
         * {@link https://github.com/JorgenVatle/meteor-vite/issues/29}
         * {@link https://github.com/vitejs/vite-plugin-react/issues/11#discussion_r430879201}
         */
        {
            const packageJson = getProjectPackageJson();
            this.needsReactPreamble = false;
            
            if ('@vitejs/plugin-react' in packageJson.dependencies) {
                this.needsReactPreamble = true;
            }
            if ('@vitejs/plugin-react' in packageJson.devDependencies) {
                this.needsReactPreamble = true;
            }
        }
    }

    public async stringTemplate(): Promise<string> {
        const { viteClientUrl, entrypointUrl } = this.urls;
        
        if (!this.config.ready) {
            if ('getTextAsync' in Assets) {
                return Assets.getTextAsync('src/loading/dev-server-splash.html');
            }
            
            return Assets.getText('src/loading/dev-server-splash.html')!;
        }
        
        const moduleLines = [
            `<script src="${viteClientUrl}" type="module" id="${VITE_CLIENT_SCRIPT_ID}"></script>`,
            `<script src="${entrypointUrl}" type="module" id="${VITE_ENTRYPOINT_SCRIPT_ID}"></script>`
        ]
        
        if (this.needsReactPreamble) {
            moduleLines.unshift(`
                <script type="module">
                  import RefreshRuntime from "${this.urls.reactRefresh}";
                  RefreshRuntime.injectIntoGlobalHook(window)
                  window.$RefreshReg$ = () => {}
                  window.$RefreshSig$ = () => (type) => type
                  window.__vite_plugin_react_preamble_installed__ = true
                </script>
            `)
        }
        
        return moduleLines.join('\n');
    }
    
    public injectScriptsInDOM() {
        if (Meteor.isServer) {
            throw new Error('This can only run on the client!');
        }
        if (!Meteor.isDevelopment) {
            return;
        }
        
        // If the scripts already exists on the page, throw an error to prevent adding more than one script.
        const existingScript = document.getElementById(VITE_ENTRYPOINT_SCRIPT_ID) || document.getElementById(VITE_CLIENT_SCRIPT_ID);
        if (existingScript) {
            throw new Error('Vite script already exists in the current document');
        }
        
        const TemporaryElements = {
            splashScreen: document.getElementById('meteor-vite-splash-screen'),
            styles: document.getElementById('meteor-vite-styles'),
        }
        
        // Otherwise create a new set of nodes so they can be appended to the document.
        const viteEntrypoint = document.createElement('script');
        viteEntrypoint.id = VITE_ENTRYPOINT_SCRIPT_ID;
        viteEntrypoint.src = this.urls.entrypointUrl;
        viteEntrypoint.type = 'module';
        viteEntrypoint.setAttribute('defer', 'true');
        
        const viteClient = document.createElement('script');
        viteClient.id = VITE_CLIENT_SCRIPT_ID;
        viteClient.src = this.urls.viteClientUrl;
        viteClient.type = 'module';
        
        viteEntrypoint.onerror = (error) => {
            DevConnectionLog.error('Vite entrypoint module failed to load! Will refresh page shortly...', error);
            setTimeout(() => window.location.reload(), 15000);
        }
        viteEntrypoint.onload = () => {
            DevConnectionLog.info('Loaded Vite module dynamically! Hopefully all went well and your app is usable. 🤞');
            TemporaryElements.splashScreen?.remove()
            TemporaryElements.styles?.remove();
        }
        
        document.body.prepend(viteEntrypoint, viteClient);
    }
}

const runtimeConfig: RuntimeConfig = {
    ready: false,
    host: 'localhost',
    baseUrl: 'http://localhost:0',
    port: 0,
    entryFile: '',
    lastUpdate: Date.now(),
}

export const ViteConnection = {
    publication: '_meteor_vite' as const,
    methods: {
        refreshConfig: '_meteor_vite_refresh_config',
    },
    configSelector: { _id: 'viteConfig' },
}

export async function getConfig() {
    const viteConfig = await MeteorViteConfig.findOneAsync(ViteConnection.configSelector);
    const config = viteConfig || runtimeConfig;
    let baseUrl = config.resolvedUrls?.network?.[0] || config.resolvedUrls?.local?.[0] || `http://localhost:${config.port}`;
    
    if (process.env.METEOR_VITE_HOST) {
        baseUrl = `${process.env.METEOR_VITE_PROTOCOL || 'http'}://${process.env.METEOR_VITE_HOST}:${process.env.METEOR_VITE_PORT || config.port}`
    }
    
    // Strip any trailing '/' characters
    baseUrl = baseUrl.replace(/\/+$/g, '');
    
    return {
        ...config,
        baseUrl,
        age: Date.now() - config.lastUpdate,
    }
}

export async function setConfig<TConfig extends Partial<RuntimeConfig>>(config: TConfig) {
    Object.assign(runtimeConfig, config, ViteConnection.configSelector, { lastUpdate: Date.now() });
    
    if (runtimeConfig.port && runtimeConfig.host && runtimeConfig.entryFile) {
        runtimeConfig.ready = true;
    }
    
    await MeteorViteConfig.upsertAsync(ViteConnection.configSelector, runtimeConfig);
    return runtimeConfig;
}

if (Meteor.isDevelopment) {
    MeteorViteConfig = new Mongo.Collection(ViteConnection.publication, { connection: null });
}
const logLabel = Meteor.isClient ? `[Meteor-Vite] ⚡ ` : '⚡  ';

export const DevConnectionLog = {
    _logToScreen(message: string) {
        if (!Meteor.isClient) return;
        const messageNode = document.createElement('div');
        messageNode.innerText = message;
        document.querySelector('.vite-status-text')?.prepend(messageNode);
    },
    info: (message: string, ...params: Parameters<typeof console.log>) => {
        DevConnectionLog._logToScreen(` ⚡ ${message}`);
        console.info(
            `${logLabel} ${message}`,
            ...params,
        )
    },
    debug: (message: string, ...params: Parameters<typeof console.log>) => {
        DevConnectionLog._logToScreen(` ⚡ ${message}`);
        console.debug(
            `${logLabel} ${message}`,
            ...params,
        )
    },
    error: (message: string, ...params: Parameters<typeof console.log>) => {
        for (const param of params) {
            if (param instanceof Error && param.stack) {
                DevConnectionLog._logToScreen(param.stack);
            }
        }
        DevConnectionLog._logToScreen(` ⚡ ${message}`);
        console.error(
            `${logLabel} ${message}`,
            ...params,
        )
    },
};
