import HTTP from 'http';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import pc from 'picocolors';
import Logger from './utility/Logger';
import type { BoilerplateData } from './vite-boilerplate/common';
import { ViteDevServerWorker } from './vite-boilerplate/development';
import { ViteProductionBoilerplate } from './vite-boilerplate/production';

const worker = Meteor.isProduction ? new ViteProductionBoilerplate()
                                   : new ViteDevServerWorker();


Meteor.startup(() => {
    const viteBundlerLegacy = pc.blue('jorgenvatle:vite-bundler');
    const viteBundler = pc.underline(pc.blue('jorgenvatle:vite'));
    const sh = pc.dim('$');
    const command = (command: string, params: string) => [pc.underline(pc.bold(pc.cyan(command))), pc.cyan(params)].join(' ')
    if (Meteor.release.toLowerCase().startsWith('meteor@3')) {
        Logger.warn(`You are using a Meteor v2 compatability release of ${viteBundlerLegacy}!`);
        Logger.warn(`This package has been deprecated in favor of ${viteBundler}`);
        Logger.warn(`More info: https://github.com/JorgenVatle/meteor-vite?tab=readme-ov-file#meteor-v3`)
        Logger.warn(`To upgrade:`, [
            '',
            `${sh} ${command('meteor', 'remove jorgenvatle:vite-bundler')}`,
            `${sh} ${command('meteor', 'add jorgenvatle:vite')}`,
            `${sh} ${command('npm', 'i meteor-vite@latest')}`,
            ''
        ].join('\n   '));
    }
    
    if ('start' in worker) {
        worker.start();
    }
})

WebAppInternals.registerBoilerplateDataCallback('meteor-vite', async (request: HTTP.IncomingMessage, data: BoilerplateData) => {
    const { dynamicBody, dynamicHead } = await worker.getBoilerplate();
    
    if (dynamicHead) {
        data.dynamicHead = `${data.dynamicHead || ''}\n${dynamicHead}`;
    }
    
    if (dynamicBody) {
        data.dynamicBody = `${data.dynamicBody || ''}\n${dynamicBody}`;
    }
});

if (worker instanceof ViteProductionBoilerplate) {
    Meteor.startup(() => {
        Logger.debug(`Vite asset base URL: ${worker.baseUrl}`);
        worker.makeViteAssetsCacheable();
    })
    
    // Prevent Meteor from sending a 200 OK HTML file when the request is clearly not valid.
    // If an asset is found by Meteor, this hook will not be called.
    WebApp.connectHandlers.use(worker.assetDir, (req, res, next) => {
        res.writeHead(404, 'Not found');
        res.write('Vite asset could not be found.')
        Logger.warn(`Served 404 for Vite asset request: ${req.originalUrl}`);
        res.end();
    })
}

