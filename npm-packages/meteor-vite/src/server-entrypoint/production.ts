import { ViteProductionBoilerplate } from '@/internals/boilerplate/Production';
import type { ViteManifestFile } from '@/internals/scripts/Build';
import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import Logger from '../utilities/Logger';

Meteor.startup(async () => {
    if (!Meteor.isProduction) {
        return;
    }
    
    console.log('[Vite] Fetching manifest...');
    const manifest = await Assets.getTextAsync(`${__VITE_ASSETS_DIR__}/client.manifest.json`);
    const files: Record<string, ViteManifestFile> = JSON.parse(manifest);
    
    const boilerplate = new ViteProductionBoilerplate({
        base: process.env.METEOR_VITE_BASE_URL || import.meta.env.BASE_URL,
        assetsDir: __VITE_ASSETS_DIR__,
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
    
    if (__VITE_DYNAMIC_ASSET_BOILERPLATE__) {
        WebAppInternals.registerBoilerplateDataCallback('meteor-vite', (req, data) => {
            const { dynamicHead, dynamicBody } = boilerplate.getBoilerplate();
            data.dynamicHead = data.dynamicHead || '';
            data.dynamicBody = data.dynamicBody || '';
            data.dynamicHead += dynamicHead;
            data.dynamicBody += dynamicBody;
        })
    }
})