import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import { createApp } from './main';
import { renderToString } from 'vue/server-renderer';

if (!Meteor.isServer) {
    throw new Meteor.Error('server-only', 'UI server module can only be accessed by the Meteor server!');
}

Meteor.startup(() => {
    WebAppInternals.registerBoilerplateDataCallback('vue-ssr', async (req, data) => {
        const { app, router } = createApp();
        
        await router.push(req.url || '/');
        const context = {};
        
        const html = await renderToString(app, context);
        
        data.dynamicBody = [
            data.dynamicBody || '',
            `<div id="app">${html}</div>`,
        ].join('\n')
    });
    
    console.log('Initialized SSR Boilerplate callback');
})
