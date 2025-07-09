import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
    Meteor.startup(async () => {
        if (Meteor.settings?.packages?.vite?.env?.MODE === 'production') {
            // Production bundle detected.
            // Meteor-Vite has been bundled into the app, so there is no need
            // for doing anything from within the jorgenvatle:vite package runtime.
            return;
        }
        
        const { ModuleRunner } = await import('../util/ModuleRunner');
        await ModuleRunner.runScript('startDevServer');
    })
}

export {}
