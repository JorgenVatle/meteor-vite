import { entryModules } from '/server/entryModules';
import { Script } from 'vm';

const vm = new Script(entryModules.serverVm.sourceText, {
    filename: '/home/jorgen/projects/meteor-vite/examples/vue/server/_vite-ssr.mts',
});

export const init = vm.runInThisContext({
    displayErrors: true,
});