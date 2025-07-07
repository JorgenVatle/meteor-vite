import { Meteor } from 'meteor/meteor';
import { runBootstrapScript } from '../util/Bootstrap';
import { CurrentConfig } from '../util/CurrentConfig';
import Logger from '../util/Logger';

if (Meteor.isServer) {
    Meteor.startup(async () => {
        if (CurrentConfig.mode === 'production') {
            return;
        }
        
        try {
            await runBootstrapScript('initializeViteDevServer');
            Logger.success('Vite should be ready to go!');
        }  catch (error) {
            Logger.warn('Failed to start Vite dev server!');
            console.error(error);
            throw error;
        }
    })
}

export {}
