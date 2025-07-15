import { Meteor } from 'meteor/meteor';
import LinksCollection from './links.collection';

Meteor.publish('links', () => {
    return LinksCollection.find({}, {
        sort: {
            createdAt: -1,
        },
        limit: 50,
    })
})