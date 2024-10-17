// Wait for Vite server to fire up before refreshing the client
// Todo: omit this module entirely in production build to save space

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import {
    getConfig,
    DevConnectionLog,
    RuntimeConfig,
    ViteConnection,
    VITE_ENTRYPOINT_SCRIPT_ID, ViteDevScripts,
} from './loading/vite-connection-handler';

let subscription: Meteor.SubscriptionHandle;
let initialConfig: RuntimeConfig;


function watchConfig(config: RuntimeConfig) {
    if (initialConfig.host !== config.host) {
        return onChange(config);
    }
    
    if (initialConfig.ready !== config.ready) {
        return onChange(config);
    }
    
    if (initialConfig.port !== config.port) {
        return onChange(config);
    }
    
    if (config.ready) {
        return onReady(config);
    }
}

function onReady(config: RuntimeConfig) {
    if (hasLoadedVite()) {
        DevConnectionLog.info('Vite has already been loaded. Waiting on changes before refreshing.', { config });
        return;
    }
    
    new ViteDevScripts(config).injectScriptsInDOM();
    return;
}

function onChange(config: RuntimeConfig) {
    DevConnectionLog.info(
        'Meteor-Vite dev server details changed from %s to %s',
        buildConnectionUri(initialConfig),
        buildConnectionUri(config),
        { initialConfig, newConfig: config }
    );
    
    if (!config.ready) {
        DevConnectionLog.info('Meteor-Vite dev server not ready yet. Waiting on server to become ready...');
        return;
    }
    
    if (hasLoadedVite()) {
        DevConnectionLog.info('Attempting to refresh current Vite session to load new server config...')
        setTimeout(() => window.location.reload(), 1000);
        return;
    }
    
    onReady(config);
}

function hasLoadedVite() {
    return !!document.getElementById(VITE_ENTRYPOINT_SCRIPT_ID);
}

Meteor.startup(() => {
    if (!Meteor.isDevelopment) {
        return;
    }
    
    Tracker.autorun(function() {
        subscription = Meteor.subscribe(ViteConnection.publication);
        const config = getConfig();
        if (!initialConfig && subscription.ready()) {
            config.then((config) => initialConfig = config);
        }
        
        DevConnectionLog.debug('Vite connection config changed', config);
        
        if (!initialConfig) {
            return;
        }
        
        getConfig().then((config) => {
            watchConfig(config);
        })
    });
    
    if (!hasLoadedVite()) {
        forceConfigRefresh();
    }
});

/**
 * Failsafe to force a refresh of the server's runtime config.
 */
function forceConfigRefresh() {
    const forceRefreshAfter = 5 * 1000 // 5 seconds
    const interval = setInterval(async () => {
        let config = await getConfig();
        const lastUpdateMs = Date.now() - config.lastUpdate;
        if (lastUpdateMs < forceRefreshAfter) {
            return;
        }
        if (hasLoadedVite()) {
            clearInterval(interval);
            return;
        }
        config = await Meteor.callAsync(ViteConnection.methods.refreshConfig);
        
        if (!config) {
            DevConnectionLog.error('Received empty Vite runtime config from server!');
            return;
        }
        watchConfig(config);
    }, 2500);
}

declare global {
    interface Window {
        __METEOR_VITE_STARTUP__?: boolean;
    }
}

function buildConnectionUri(config: RuntimeConfig) {
    return `http://${config.host || 'localhost'}:${config.port}/`
}
