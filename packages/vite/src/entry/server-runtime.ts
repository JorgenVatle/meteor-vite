import { Meteor } from 'meteor/meteor';
import PackageJSON from '../../package.json';

if (Meteor.isServer) {
    injectPackageJsonData();
    
    Meteor.startup(async () => {
        // These settings are populated by the Vite production bundle.
        if (Meteor.settings?.packages?.vite?.env?.MODE === 'production') {
            // Production bundle detected.
            // Meteor-Vite has been bundled into the app, so there is no need
            // for doing anything from within the jorgenvatle:vite package runtime.
            return;
        }
        
        const { ModuleRunner } = await import('../util/ModuleRunner');
        await ModuleRunner.runScript('startDevServer');
    })
}

/**
 * Add version information to Meteor settings so we validate that the correct
 * jorgenvatle:vite version is installed at runtime.
 */
function injectPackageJsonData() {
    const packages = Meteor.settings.packages || {};
    const vite = packages.vite || {};
    
    Object.assign(vite, {
        package: PackageJSON,
    });
    
    Object.assign(Meteor.settings, {
        packages,
    })
}

export {}
