import { Meteor } from 'meteor/meteor';
import { CurrentConfig } from '../util/CurrentConfig';
import Logger from '../util/Logger';
import { ModuleRunner } from '../util/ModuleRunner';

if (Meteor.isServer) {
    Meteor.startup(async () => {
        if (CurrentConfig.mode === 'production') {
            return;
        }
        
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
