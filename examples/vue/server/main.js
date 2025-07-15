// import("./../_vite-bundle/server/__entry.js").catch((e) => console.warn("Failed to import Meteor Server bundle from Vite! This may sometimes happen if it's your first time starting the app.", e));
import { Logger } from './util';

console.log('\n'.repeat(5));

import('./vite-ssr.ts').then(async ({ init }) => {
    await init();
    Logger.info('All should be good');
}).catch((error) => {
    Logger.error('\n\nWell so that didnt work\n\n', error);
    console.log('\n'.repeat(2));
});