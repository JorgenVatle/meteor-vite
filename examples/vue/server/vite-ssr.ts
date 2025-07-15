import { entryModules } from '/server/entryModules';
import vm from 'node:vm';

const context = vm.createContext({});

const script = new vm.Script(entryModules.serverVm.sourceText, {
    filename: '/home/jorgen/projects/meteor-vite/examples/vue/server/_vite-ssr.mts',
});

export const init = script.runInNewContext(context, {
    displayErrors: true,
});