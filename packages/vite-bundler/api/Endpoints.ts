import { Meteor } from 'meteor/meteor';
import {
    type BaseDocument,
    DataStreamCollection,
    type DataStreamDocument,
    StatusCollection,
    type StatusDocument,
} from './Collections';
import { watchDataStreamLogs } from './Watchers';

export const Methods = {
    async 'meteor-vite:status/update'(status: Omit<StatusDocument, keyof BaseDocument>) {
        await StatusCollection.upsertAsync(
            { type: status.type },
            {
                $set: {
                    data: Object.assign(status.data, { updatedAt: new Date() }),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                }
            },
        );
    },
    async 'meteor-vite:log'(log: Omit<DataStreamDocument, keyof BaseDocument>) {
        await DataStreamCollection.insertAsync(Object.assign(log, {
            createdAt: new Date(),
        }));
    },
}

Meteor.startup(() => {
    if (Meteor.isProduction) {
        return;
    }
    
    Meteor.methods(Methods);
    watchDataStreamLogs();
    
    if (Meteor.isClient) {
        return;
    }
    
    Meteor.publish('meteor-vite:log', () => {
        return DataStreamCollection.find({
            type: { $in: ['log:client', 'log:shared'] },
        }, {
            limit: 50,
            sort: { createdAt: -1 },
        });
    });
    
    // Todo: clean up old logs regularly
});