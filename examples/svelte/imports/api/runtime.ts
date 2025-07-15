import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const RuntimeCollection = new Mongo.Collection<RuntimeDocument>('runtime');


Meteor.methods({
    'runtime.click': async () => {
        const { value } = (await RuntimeCollection.findOneAsync({ _id: 'clicks' }) || { value: 0 }) as { value: number };
        RuntimeCollection.upsertAsync({ _id: 'clicks' }, { $set: { _id: 'clicks', value: value + 1 } });
    }
})

export type RuntimeDocument = {
    _id: 'clicks';
    value: number;
} | {
    _id: 'time';
    value: Date;
}

export default RuntimeCollection;

Meteor.startup(() => {
    if (!Meteor.isServer) {
        return;
    }
    
    Meteor.publish('runtime', () => {
        return RuntimeCollection.find();
    });
    
    Meteor.setInterval(async () => {
        await RuntimeCollection.upsertAsync('time', { $set: { value: new Date() } })
    }, 1000);
})
