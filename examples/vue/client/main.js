/**
 * These modules are automatically imported by jorgenvatle:vite-bundler.
 * You can commit these to your project or move them elsewhere if you'd like,
 * but they must be imported somewhere in your Meteor entrypoint file.
 *
 * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages
**/
import 'meteor/test:lazy';
import 'meteor/test:ts-modules/re-exports-index';
import 'meteor/test:ts-modules/export-star-from';
import 'meteor/test:stub-validation';
import 'meteor/test:duplicate-npm-dependencies';
/** End of vite-bundler auto-imports **/
import { Cookies } from 'meteor/ostrio:cookies';

const cookies = new Cookies()
console.log('(meteor) cookies', cookies.get('meteor_login_token')) 
