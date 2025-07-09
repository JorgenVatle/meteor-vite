import { Plugin } from 'meteor/isobuild';
import { CurrentConfig } from '../util/CurrentConfig';
import Logger from '../util/Logger';
import { ModuleRunner } from '../util/ModuleRunner';
import { parseMeteorCliArgs } from '../util/parseMeteorCliArgs';

const { useBuildPlugin } = parseMeteorCliArgs();

if (!useBuildPlugin) {
    Logger.warn('Skipping initialization of Meteor-Vite build plugin');
} else {
    
    // Cleanup temporary files from previous builds.
    const cleanup = ModuleRunner.runScript('setupProject');
   
    // todo: Verify Meteor packages file to warn users if there are active incompatible plugins.
    //  The standard-minifier plugins strip out sources that the export analyzer depends on, so
    //  with these plugins installed, builds will always fail.
    
    if (CurrentConfig.mode === 'production') {
        Plugin.registerCompiler({
            filenames: [],
            extensions: [CurrentConfig.bundleFileExtension]
        }, async () => {
            try {
                await cleanup;
                return await ModuleRunner.runScript('buildForProduction');
            } catch (error) {
                Logger.error('build failed');
                console.error(error);
                throw error;
            }
        });
    } else {
        const filenames: string[] = [
            'vite.config.ts',
            'vite.config.js',
            'vite.config.mts',
            'vite.config.mjs',
        ]
        try {
            const json = await ModuleRunner.runScript('parsePackageJson');
            if (json.meteor?.vite?.configFile) {
                filenames.push(json.meteor.vite.configFile);
                Logger.info(`Using custom Vite config file path: ${json.meteor.vite.configFile}`);
            }
        } catch (error: any) {
            Logger.error(error, `Failed to resolve package.json contents. If you're using a custom Vite config file path, either use the default one or try to see why the package.json file is unavailable.`)
        }
        
        Plugin.registerCompiler({
            filenames,
            extensions: [],
        }, async () => {
            return await ModuleRunner.runScript('prepareDevServerBoilerplate');
        })
    }
    
   await cleanup;
}

