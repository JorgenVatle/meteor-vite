import { writeToPathSync } from '@/internals/lib/writeToPathSync';
import { moduleImport } from '@/utilities/server';
import Path from 'path';

export class EntryModule {
    protected readonly imports: ModuleImport[] = [];
    constructor(public readonly path: string) {
    
    }
    
    public addImport(module: ModuleImport) {
        this.imports.push(module);
    }
    
    public async write() {
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
}

type ModuleImport = {
    path: string;
}