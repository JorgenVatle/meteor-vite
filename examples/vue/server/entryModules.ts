import { resolve, ResolvedModule } from '/server/ModuleResolver';
import { Logger } from '/server/util';
import FS from 'node:fs';
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

export class NodeModule {
    public readonly module: vm.Module;
    protected readonly context = vm.createContext({});
    
    constructor(protected readonly resolved: ResolvedModule) {
        this.module = new vm.SourceTextModule(this.resolved.getText(), this.context);
    }
    
    protected readonly linker: vm.ModuleLinker = async (specifier, referrer, extra) => {
        return NodeModule.resolve(specifier, referrer, extra);
    }
    
    public async evaluate() {
        Logger.info(`Linking module: ${this.resolved.importPath}`);
        await this.module.link(this.linker);
        Logger.info(`Evaluating module: ${this.resolved.importPath}`);
        await this.module.evaluate();
        return this.module;
    }
    
    public static resolve(specifier: string, referrer?: vm.Module, extra?: {}): Promise<vm.Module> {
        const resolved = resolve(specifier);
        if (resolved.loggable) {
            Logger.info('Resolving module link', { specifier, referrer, extra });
        }
        if (resolved.isValid) {
            return new this(resolved).evaluate();
        }
        if (resolved.type === 'node-module') {
            return new this(resolved.getMainExport()).evaluate();
        }
        throw new Error(`Module not found: ${specifier}`);
    }
}

export const entryModules = {
    meteorEntry: new EntryModule('./main.js'),
    serverVm: new EntryModule('./server-vm.mjs'),
};