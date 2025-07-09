import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
    Meteor.startup(async () => {
        if (Meteor.settings?.packages?.vite?.env?.MODE === 'production') {
            // Production bundle detected.
            // Meteor-Vite has been bundled into the app, so there is no need
            // for doing anything from within the jorgenvatle:vite package runtime.
            return;
        }
        
        const Logger = await import('../util/Logger').then(module => module.default);
        const { ModuleRunner } = await import('../util/ModuleRunner');
        
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
