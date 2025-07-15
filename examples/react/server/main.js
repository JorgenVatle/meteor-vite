/**
 * Import all your Meteor methods and publications.
 */
import '../imports/api/links/server';
// ...

Meteor.startup(() => {
    console.log(`Meteor server started up successfully: ${Meteor.absoluteUrl()}`)
})
