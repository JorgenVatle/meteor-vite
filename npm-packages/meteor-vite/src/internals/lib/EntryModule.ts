import { writeToPathSync } from '@/internals/lib/writeToPathSync';
import { hasModuleImport, moduleImport } from '@/utilities/server';
import FS from 'node:fs';
import Path from 'path';

export class EntryModule {
    protected readonly imports: ModuleImport[] = [];
    constructor(public readonly path: string) {
    
    }
    
    public addImport(module: ModuleImport) {
        this.imports.push(module);
    }
    
    public write() {
        const importLines = this.imports.map(({ path }) => {
            // Importing a file directly (not a node module)
            if (path.startsWith('.') || path.startsWith('/')) {
                return moduleImport(Path.relative(this.path, path))
            }
            
            // Importing a package from node_modules
            return moduleImport(path);
        });
        
        writeToPathSync(this.path, importLines.join('\n'));
    }
    
    /**
     * Append missing imports to to file instead of overwriting it.
     * @param module
     */
    public appendMissing() {
        const content = FS.readFileSync(this.path, 'utf-8');
        const imports: string[] = [];
        
        for (const module of this.imports) {
            if (hasModuleImport({ content, path: module.path })) {
                continue;
            }
            imports.push(moduleImport(module.path));
        }
        
        if (imports.length === 0) {
            return;
        }
        
        FS.writeFileSync(this.path, [imports, content].flat().join('\n'));
    }
}

type ModuleImport = {
    path: string;
}