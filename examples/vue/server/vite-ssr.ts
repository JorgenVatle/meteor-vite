import { entryModules } from '/server/entryModules';
import { resolve } from '/server/ModuleResolver';
import vm from 'node:vm';

const context = vm.createContext({});

const resolveVm: vm.ModuleLinker = async (specifier: string, ref): Promise<vm.Module> => {
    console.log('Resolving module:', specifier);
    const resolvedModule = resolve(specifier);
    
    if (resolvedModule.type === 'standard-library') {
        const exports = require(resolvedModule.importPath);
        exports.default = exports;
        const module = new vm.SyntheticModule(Object.keys(exports), function() {
            Object.entries(exports).forEach(([key, value]) => {
                console.log({ key, value });
                this.setExport(key, value);
            });
            this.setExport('default', exports);
        }, {
            context: ref.context,
        });
        await module.link(() => {
            throw new Error('Tried to resolve modules within standard library')
        });
        
        await module.evaluate();

        return module;
    }
    
    throw new Error(`Unknown module type: ${resolvedModule.type}`)
}

export async function init() {
    const module = new vm.SourceTextModule(entryModules.serverVm.sourceText, {
        context,
    });
    
    await module.link(resolveVm);
    
    await module.evaluate();
    
    return module.namespace;
}