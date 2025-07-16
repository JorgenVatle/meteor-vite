/**
 * These modules are automatically imported by jorgenvatle:vite.
 * You can commit these to your project or move them elsewhere if you'd like,
 * but they must be imported somewhere in your Meteor mainModule.
 *
 * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages
 **/
import '../_vite-bundle/server/_entry-meteor.mjs';
/** End of vite auto-imports **/
/**
 * Import all your Meteor methods and publications.
 */
import '../imports/api/links/server';
// ...

Meteor.startup(() => {
    console.log(`Meteor server started up successfully: ${Meteor.absoluteUrl()}`)
})
