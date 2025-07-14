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
    const viteBundler = (pc.blue('jorgenvatle:vite'));
    const meteorVite = (pc.bold('Meteor-Vite'));
    const meteorV2 = pc.underline(pc.bold('Meteor v2'));
    const meteorV3 = (pc.bold('Meteor v3'));
    const sh = pc.dim('$');
    const label = {
        install: 'Add: ',
        uninstall: 'Remove: ',
        example: 'Example: ',
        link: 'More info: ',
    }
    const padCount = Math.max(...Object.keys(label).map((label => label.length))) + 6;
    const logSection = (label: string, lines: string[], lineBreak = '\n') => {
        Logger.warn(
            label.padEnd(padCount - 4, ' '),
            lines.join('\n' + ' '.repeat(padCount)) + lineBreak
        );
    }
    
    const command = (command: string, params: string) => [((pc.cyan(command))), pc.bold(pc.cyan(params))].join(' ')
    if (Meteor.release.toLowerCase().startsWith('meteor@3')) {
        Logger.warn(`This application is running ${meteorV3}!\n`);
        Logger.warn(`The ${viteBundlerLegacy} package is maintained for backwards compatability with ${meteorV2}!`);
        Logger.warn(`You should replace it with ${pc.underline(viteBundler)} instead, which supports all modern Vite features.\n`);
        console.log('\n'); // Vertical padding
        
        logSection(label.install, [
            `${viteBundler}\t\t ${pc.dim('Meteor v3')}`,
        ], '');
        
        logSection(label.uninstall, [
            `${viteBundlerLegacy}\t ${pc.dim('Meteor v2 (Deprecated)')}`,
        ]);
        
        
        logSection(label.example, [
            `${sh} ${command('meteor remove', 'jorgenvatle:vite-bundler')}`,
            `${sh} ${command('meteor add', 'jorgenvatle:vite')}`,
            `${sh} ${command('npm i', 'meteor-vite@latest')}`,
        ]);
        
        logSection(label.link, [
            `https://github.com/JorgenVatle/meteor-vite?tab=readme-ov-file#meteor-v3`,
        ])
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

