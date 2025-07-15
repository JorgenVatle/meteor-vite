import { Logger } from '/server/util';
import FS from 'node:fs';
import Path from 'node:path';
import vm from 'node:vm';

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

export class NodeModule extends EntryModule {
    public readonly module: vm.Module;
    protected readonly context = vm.createContext({});
    
    constructor(protected readonly moduleName: string, exportName = 'index.js') {
        super(modulePath(Path.join(moduleName, exportName)));
        this.module = new vm.SourceTextModule(this.sourceText, this.context);
    }
    
    protected readonly linker: vm.ModuleLinker = async (specifier, referrer, importAttributes) => {
        Logger.info('Resolving module link', { specifier, referrer, importAttributes });
        return new NodeModule(specifier).module;
    }
    
    public async evaluate() {
        Logger.info(`Linking module: ${this.moduleName}`);
        await this.module.link(this.linker);
        Logger.info(`Evaluating module: ${this.moduleName}`);
        await this.module.evaluate();
    }
}

export const entryModules = {
    meteorEntry: new EntryModule('./main.js'),
    serverVm: new EntryModule('./server-vm.mjs'),
};