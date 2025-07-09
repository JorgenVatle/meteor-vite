import { ViteProductionBoilerplate } from '@/internals/boilerplate/Production';
import { meteorSettings } from '@/internals/lib/meteorSettings';
import type { ViteManifestFile } from '@/internals/scripts/buildForProduction';
import { Logger } from '@/utilities/server';
import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';

Meteor.startup(async () => {
    if (meteorSettings.env.MODE !== 'production') {
        Logger.warnOnce({ id: 'non-production-mode' }, 'Tried to load production server entry in development mode.')
        return;
    }
    
    console.log('[Vite] Fetching manifest...');
    const manifest = await Assets.getTextAsync(`${meteorSettings.assetsDir}/client.manifest.json`);
    const files: Record<string, ViteManifestFile> = JSON.parse(manifest);
    
    const boilerplate = new ViteProductionBoilerplate({
        base: meteorSettings.base,
        assetsDir: meteorSettings.assetsDir,
        files,
    });
    
    WebApp.handlers.use(boilerplate.assetDir, (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/plain');
        res.writeHead(404, 'Not found');
        res.write('Vite asset not found');
        res.end();
        Logger.warn(`Served 404 for unknown Vite asset: ${req.originalUrl}`);
        Logger.warnOnce({ id: 'vite-asset-not-found' }, [
            'If you expected this asset to exist, please open an issue over on GitHub.',
            `You can debug what's being included in your bundle by setting DEBUG='vite-bundler:*' when building for production`,
            '',
            'Do note that that this may happen if a client just loaded a cached version of your app as the browser will try to re-validate assets.',
        ].join('\n'))
    });
    
    // Todo: Instead of serving assets with Meteor's built-in static file handler,
    //  add a custom asset route where we have better control over caching and CORS rules.
    boilerplate.makeViteAssetsCacheable();
    
    if (meteorSettings.dynamicAssetBoilerplate) {
        WebAppInternals.registerBoilerplateDataCallback('meteor-vite', (req, data) => {
            const { dynamicHead, dynamicBody } = boilerplate.getBoilerplate();
            data.dynamicHead = data.dynamicHead || '';
            data.dynamicBody = data.dynamicBody || '';
            data.dynamicHead += dynamicHead;
            data.dynamicBody += dynamicBody;
        })
    }
})