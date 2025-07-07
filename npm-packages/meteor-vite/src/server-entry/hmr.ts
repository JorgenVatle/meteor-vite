/// <reference types="vite/client" />
import { bugs, createSimpleLogger } from '@/utilities';
import { Meteor } from 'meteor/meteor';
import pc from 'picocolors';

declare global {
    interface MeteorViteRuntimeConfig {
        initialHmrState?: InitialHmrState;
    }
    namespace globalThis {
        namespace Package {
            const ejson: undefined | {
                EJSON: {
                    _getTypes(original: boolean): Map<string, Function> | Record<string, Function>;
                    _getTypes(original: true): Map<string, Function>;
                    _getTypes(original: false): Record<string, Function>;
                }
            }
        }
        
        namespace SyncedCron {
            const _entries: Record<string, Function>
        }
    }
}

interface InitialHmrState {
    method_handlers: Record<string, Function>;
    publish_handlers: Record<string, Function>;
    packages: PackageState;
}

interface PackageState {
    EJSON?: {
        types: Map<string, Function>;
    };
}

function createInitialState(): InitialHmrState {
    if (globalThis.MeteorViteRuntimeConfig.initialHmrState) {
        return globalThis.MeteorViteRuntimeConfig.initialHmrState;
    }
    
    const packages: PackageState = {};
    
    if (globalThis.Package.ejson) {
        packages.EJSON = {
            types: new Map(globalThis.Package.ejson.EJSON._getTypes(true).entries())
        }
    }
    
    return {
        method_handlers: { ...Meteor.server.method_handlers },
        publish_handlers: { ...Meteor.server.publish_handlers },
        packages,
    }
}

if (import.meta.hot) {
    // Initial handles
    // Todo: refactor to use stubs for tracking methods and publications created by the server entry.
    const initialState = globalThis.MeteorViteRuntimeConfig.initialHmrState ??= createInitialState();
    const { method_handlers, publish_handlers, packages } = initialState;
    
    const logger = createSimpleLogger('HMR');
    
    await new Promise<void>((resolve) => {
        // Todo: Wrap in Meteor.startup() block that runs BEFORE the server entrypoint but AFTER all other Meteor packages
        Object.assign(method_handlers, Meteor.server.method_handlers)
        Object.assign(publish_handlers, Meteor.server.publish_handlers);
        logger.debug('Detected default Meteor API resources. These will not be altered on HMR', { method_handlers, publish_handlers })
        resolve()
    })
    
    import.meta.hot.on('vite:beforeFullReload', () => {
        const countPersisted = {
            methods: Object.keys(method_handlers).length,
            publications: Object.keys(publish_handlers).length,
        }
        const count = {
            methodHandles: pc.yellow(
                (Object.keys(Meteor.server.method_handlers).length - countPersisted.methods).toLocaleString()
            ),
            publishHandlers: pc.yellow(
                (Object.keys(Meteor.server.publish_handlers).length - countPersisted.publications).toLocaleString()
            ),
        }
        Meteor.server.method_handlers = Object.assign({}, method_handlers);
        Meteor.server.publish_handlers = Object.assign({}, publish_handlers);
        console.info([
            `[${pc.cyan('HMR')}] Cleaned up ${count.methodHandles} method and ${count.publishHandlers} publish handlers`,
            [
                `${pc.yellow(countPersisted.methods)} methods and ${pc.yellow(countPersisted.publications)} publications were retained.`,
                'If there are other resources that persist after hot-reloading,',
                'please open an issue over on GitHub so we can have that taken care of.',
            ].map((line) => `${pc.dim('L')}   ${line}`),
            
            `🐛  ${pc.blue(bugs.url)}`
            
        ].flat().join('\n') + '\n\n');
        
        if (globalThis.SyncedCron) {
            logger.info('Reset job entries for SyncedCron');
            Object.assign(globalThis.SyncedCron, {
                _entries: {}
            });
        }
        if (globalThis.Package.ejson) {
            const types = globalThis.Package.ejson?.EJSON._getTypes(true)!;
            logger.debug(`Reset custom EJSON entries:`, types.entries());
            types.clear();
            for (const [key, value] of packages.EJSON?.types.entries() || []) {
                types.set(key, value);
            }
        }
        if (globalThis.Accounts) {
            Object.assign(globalThis.Accounts, {
                _beforeExternalLoginHook: null,
                _onCreateLoginTokenHook: null,
                _onCreateUserHook: null,
                _onExternalLoginHook: null,
                _additionalFindUserOnExternalLogin: null,
            })
        }
    })
}
