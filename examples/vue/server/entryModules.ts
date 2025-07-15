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
    protected readonly module: vm.SourceTextModule;
    protected readonly context = vm.createContext({});
    
    constructor(protected readonly resolved: ResolvedModule) {
        Logger.info(`Initialized NodeModule: ${resolved.importPath}`);
        this.module = new vm.SourceTextModule(resolved.getText(), this.context);
    }
    
    protected readonly linker: vm.ModuleLinker = async (specifier, referrer, extra) => {
        const resolved = this.resolved.resolve(specifier);
        if (resolved.loggable) {
            Logger.info(`Resolving ${specifier} (${resolved.type}) specifier from ${this.resolved.importPath}`, { specifier, referrer, extra });
        }
        return new vm.SourceTextModule(resolved.getText(), this.context);
    }
    
    public async evaluate() {
        Logger.info(`Linking module: ${this.resolved.importPath}`);
        await this.module.link(this.linker);
        Logger.info(`Evaluating module: ${this.resolved.importPath}`);
        await this.module.evaluate();
        return this.module;
    }
    
    public static resolve(specifier: string) {
        const module = new this(resolve(specifier));
        return module.evaluate();
    }
}

export const entryModules = {
    meteorEntry: new EntryModule('./server/main.js'),
    serverVm: new EntryModule('./server/server-vm.mjs'),
};