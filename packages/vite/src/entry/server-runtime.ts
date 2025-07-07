import { Meteor } from 'meteor/meteor';
import { runBootstrapScript } from '../util/Bootstrap';
import { CurrentConfig } from '../util/CurrentConfig';

if (Meteor.isServer) {
    Meteor.startup(async () => {
        if (CurrentConfig.mode === 'production') {
            return;
        }
        
        const Logger = await import('../util/Logger').then(module => module.default)
        
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
