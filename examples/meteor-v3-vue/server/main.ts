import { Meteor } from "meteor/meteor";
import { onPageLoad } from "meteor/server-render";
import LinksCollection from '../imports/api/links/links.collection';
import '../imports/api/links/links.methods';
import '../imports/api/links/server/links.publications';
import '../imports/api/relay/publications/chat';
import '../imports/api/relay/methods/chat';

Meteor.startup(async () => {
  // Code to run on server startup.
  console.log(`Greetings from ${module.id}!`);
  console.log(`Meteor server started up successfully: ${Meteor.absoluteUrl()}`);
  
  if (await LinksCollection.find({}).countAsync() > 0) {
    return;
  }
  
  await LinksCollection.insertAsync({
    title: 'Meteor.com',
    url: 'https://meteor.com',
  });
});

onPageLoad(sink => {
  // Code to run on every request.
  sink.renderIntoElementById(
    "server-render-target",
    `Server time: ${new Date}`
  );
});
