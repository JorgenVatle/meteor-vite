// Old React example apps would directly import a module at this path to retrieve Vite server information
// to then use for injecting a React preamble into the HTML served by Meteor in development mode.
//
// The React preamble is now automatically included by Meteor-Vite and importing anything from here
// is no longer necessary.

import { MeteorViteError } from '../src/utility/Errors';
import pc from 'picocolors';

export function getConfig() {
    throw new MeteorViteError([
        'Module has moved: ' + pc.yellow('jorgenvatle:vite-bundler/loading/vite-connection-handler'),
        '',
        `You're likely seeing this because your app is generating a React preamble for your Vite dev server`,
        'This is no longer needed and you can safely remove the boilerplate used to achieve this.',
        '',
        'Remove the following module/code if it exists in your app:',
        `${pc.yellow('react-refresh.js')}: https://github.com/JorgenVatle/meteor-vite/blob/d3633cb015206cb61168fa135c33b89331afeb04/examples/react/server/react-refresh.js`,
        '',
    ].join('\n'))
}