import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if(Meteor.isServer){
  checkNpmVersions({
    'svelte': ">=3.25.0"
  }, 'rdb:svelte-meteor-data');
  // this require is here only to make sure we can validate the npm dependency above
  require(`svelte/package.json`)
}
export { default as useTracker } from './use-tracker';

import './subscribe';

if (Package['mongo']) {
  import './cursor';
}

if (Package['reactive-var']) {
  import './reactive-var';
}

if (Package['session'] && Meteor.isClient) {
  export { default as useSession } from './use-session';
}

// Import this last, since it overwrites the built-in Tracker.autorun
import './autorun';
