import { resolve, ResolvedModule } from '/server/ModuleResolver';
import { Logger } from '/server/util';
import FS from 'node:fs';
import Path from 'node:path';
import vm from 'node:vm';

class EntryModule {
    public readonly sourceText: string;
    protected readonly resolved: ResolvedModule;
    constructor(path: string) {
        this.resolved = resolve(path);
        this.sourceText = this.resolved.getText();
    }
    
    public get path() {
        return this.resolved.path;
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

export class NodeModule extends EntryModule {
    public readonly module: vm.Module;
    protected readonly context = vm.createContext({});
    
    constructor(protected readonly moduleName: string, exportName = 'index.js') {
        super(Path.join(moduleName, exportName));
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