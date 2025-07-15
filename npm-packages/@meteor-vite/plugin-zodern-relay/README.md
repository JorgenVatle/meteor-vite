# Vite plugin `zodern:relay`

This is a Vite compatability package for
[`zodern:relay`](https://github.com/zodern/meteor-relay#readme) - type safe
[Meteor](https://meteor.com/) methods and publications.

This plugin acts as partial replacement for the Babel `@zodern/babel-plugin-meteor-relay` plugin required by 
`zodern:relay`. You still need the Babel plugin as it might still be required on the server.


## Installation
```sh
npm i -D @meteor-vite/plugin-zodern-relay
```

## Configuration
Add the plugin to your Vite config and you're all set. If your methods and publications reside outside of `imports/api/<methods|publications>`, specify those paths when calling the plugin.
```ts
// vite.config.ts
import zodernRelay from '@meteor-vite/plugin-zodern-relay';
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        meteor({
            clientEntry: '...',
        }),
        zodernRelay({
            directories: {
                /**
                 * Path to directories where your zodern:relay methods live
                 * @default ['./imports/methods']
                 */
                methods: ['./imports/methods'],
                
                /**
                 * Path to the directories where your zodern:relay publications live.
                 * @default ['./imports/publications']
                 */
                publications: ['./imports/publications'],
            }
        }),
    ]
})
```

## Usage & Documentation
You can use [`zodern:relay`](https://github.com/zodern/meteor-relay#readme) like you normally would. Consult their 
readme for documentation.

- `zodern:relay` - https://github.com/zodern/meteor-relay#readme
- `meteor-vite` - https://github.com/JorgenVatle/meteor-vite#readme

## License
MIT