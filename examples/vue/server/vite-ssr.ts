import FS from 'node:fs';
import Path from 'node:path';
import { Script } from 'vm';

const modulePath = (...path: string[]) => Path.join('/home/jorgen/projects/meteor-vite/examples/vue/server', ...path);

function importRaw(path: string) {
    if (path.startsWith('.')) {
        return FS.readFileSync(modulePath(path), 'utf-8');
    }
    return FS.readFileSync(modulePath('../node_modules', path), 'utf-8');
}

const entryPath = modulePath('./server-vm.mjs');
const sourceText = importRaw(entryPath);
FS.watch(entryPath, (event) => {
    console.log('Module changed:', event)
    const mainPath = modulePath('./main.js');
    const entryModule = importRaw(mainPath).split(/[\r\n]/);
    const updatedEntry = entryModule
        .filter((line) => !line.match(/\/\/\s*timestamp:/i));
    updatedEntry.push(`// timestamp: ${Date.now()}`);
    
    FS.writeFileSync(mainPath, updatedEntry.join('\n'));
    console.log('Updated entry module:', mainPath);
})

const vm = new Script(sourceText, {
    filename: '/home/jorgen/projects/meteor-vite/examples/vue/server/_vite-ssr.mts',
});

export const init = vm.runInThisContext({
    displayErrors: true,
});