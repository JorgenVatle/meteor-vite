import { Meteor } from 'meteor/meteor';
import { CurrentConfig } from '../util/CurrentConfig';
import { ModuleRunner } from '../util/ModuleRunner';

if (Meteor.isServer) {
    Meteor.startup(async () => {
        if (Meteor.settings?.packages?.vite?.env?.MODE === 'production') {
            // Production bundle detected.
            // Meteor-Vite has been bundled into the app, so there is no need
            // for doing anything from within the jorgenvatle:vite package runtime.
            return;
        }
        
        const Logger = await import('../util/Logger').then(module => module.default)
        
        try {
            await ModuleRunner.runScript('initializeViteDevServer');
            Logger.success('Vite should be ready to go!');
        }  catch (error) {
            Logger.warn('Failed to start Vite dev server!');
            console.error(error);
            throw error;
        }
    })
}

export {}
