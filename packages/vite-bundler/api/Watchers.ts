import { Meteor } from 'meteor/meteor';
import DDPLogger from '../utility/DDPLogger';
import { DataStreamCollection } from './Collections';

export function watchDataStreamLogs() {
    const startupTime = new Date();
    
    if (Meteor.isProduction) {
        throw new Error('meteor-vite data logs are only available in development mode');
    }
    
    if (Meteor.isClient) {
        Meteor.subscribe('meteor-vite:log', {
            onReady() {
                console.debug('⚡ Listening for logs from meteor-vite');
            },
            onStop(error: unknown) {
                if (!error) {
                    return console.debug('⚡ Unsubscribed from meteor-vite logs');
                }
                console.debug('⚡ Error from meteor-vite logs publication', error);
            }
        });
    }
    
    DataStreamCollection.find({ createdAt: { $gt: startupTime } }).observe({
        added(document) {
            DDPLogger.print(document);
        },
    })
}