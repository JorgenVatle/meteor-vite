/**
 * Stub module for zodern:relay
 * Used as a replacement for imports for createMethod() or createPublication() from `meteor/zodern:relay`.
 */
let relayClient;
const require = Package.modules.meteorInstall({
    '__stub__zodern-relay_client.js': (require, exports, module) => {
        relayClient = require('meteor/zodern:relay/client.ts')
    }
}, {
    "extensions": [
        ".js"
    ]
});
require('/__stub__zodern-relay_client.js');

export function createMethod(method) {
    return relayClient._createClientMethod(method.name);
}

export function createPublication(publication) {
    return relayClient._createClientPublication(publication.name);
}