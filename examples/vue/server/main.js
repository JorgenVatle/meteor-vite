// import("./../_vite-bundle/server/__entry.js").catch((e) => console.warn("Failed to import Meteor Server bundle from Vite! This may sometimes happen if it's your first time starting the app.", e));
import { Logger } from './util';
import pc from 'picocolors';

console.log('\n'.repeat(3));

Logger.info('ℹ️  Starting Meteor Vite Server\n');

import('./vite-ssr.ts').then(async ({ init }) => {
    await init();
    Logger.info('All should be good');
}).catch((error) => {
    Logger.error('\n', error);
    setTimeout(() => {
        Logger.info([
            '',
            pc.bold(pc.whiteBright(`❌ Better luck next time!`)),
            ''
        ].join('\n'))
    });
});