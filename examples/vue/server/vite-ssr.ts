import { entryModules } from '/server/entryModules';
import { Logger } from '/server/util';
import vm from 'node:vm';

const context = vm.createContext({});

function createLinker(): vm.ModuleLinker {
    return (specifier, referrer, importAttributes) => {
        Logger.info('Linking module', { specifier, referrer, importAttributes });
        return Promise.resolve(simulated);
    };
}

// language=javascript
const simulated = new vm.SourceTextModule(`
    export function createServer() {
        console.log('Foo Bar!');
    }
`);

const script = new vm.Script(entryModules.serverVm.sourceText, {
    filename: '/home/jorgen/projects/meteor-vite/examples/vue/server/_vite-ssr.mts',
    importModuleDynamically: (specifier, referrer, importAttributes, phase) => {
        Logger.info('Resolving dynamic import', {
            module: specifier,
            referrer,
            importAttributes,
            phase,
        });
        return Promise.resolve(simulated);
    }
});

export async function init() {
    const linker = createLinker();
    await simulated.link(linker);
    
    return script.runInNewContext(context, {
        displayErrors: true,
    })();
}