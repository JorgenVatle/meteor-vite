import FS from 'node:fs';
import Path from 'node:path';

const ROOT_DIR = '/home/jorgen/projects/meteor-vite/examples/vue';

class EntryModule {
    public readonly path: string;
    public readonly sourceText: string;
    constructor(path: string) {
        this.path = modulePath(path);
        this.sourceText = importRaw(this.path);
    }
    
    protected get sourceLines() {
        return this.sourceText.split(/[\r\n]/);
    }
    
    public watch() {
        FS.watch(this.path, (event) => {
            console.log('Module changed:', event);
            const updatedEntry = this.sourceLines.filter((line) => !line.match(/\/\/\s*timestamp:/i));
            updatedEntry.push(`// timestamp: ${Date.now()}`);
            
            FS.writeFileSync(this.path, updatedEntry.join('\n'));
            console.log('Updated entry module:', this.path);
        })
    }
}

class FileNotFound extends Error {
    constructor(path: string) {
        super(Path.relative(ROOT_DIR, path));
        this.name = 'FileNotFound';
    }
}

function modulePath(...parts: string[]) {
    const path = Path.join(ROOT_DIR, 'server', ...parts);
    assertExists(path);
    return path;
}

function importRaw(path: string) {
    if (path.startsWith('.')) {
        return FS.readFileSync(modulePath(path), 'utf-8');
    }
    if (path.startsWith('/')) {
        return FS.readFileSync(path, 'utf-8');
    }
    return FS.readFileSync(modulePath('../node_modules', path), 'utf-8');
}

function assertExists(path: string) {
    if (!FS.existsSync(path)) {
        throw new FileNotFound(path);
    }
}


export const entryModules = {
    meteorEntry: new EntryModule('./main.js'),
    serverVm: new EntryModule('./server-vm.mjs'),
};