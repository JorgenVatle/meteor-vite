import { writeToPathSync } from '@/internals/lib/writeToPathSync';
import { hasModuleImport, moduleImport } from '@/utilities/server';
import FS from 'node:fs';
import Path from 'path';

export class EntryModule {
    protected readonly imports: (ModuleImport & { line: string })[] = [];
    constructor(public readonly path: string) {
    
    }
    
    public addImport(module: ModuleImport) {
        let path = module.path;
        
        // Importing a file directly (not a node module)
        if (module.path.startsWith('.') || module.path.startsWith('/')) {
            path = Path.relative(this.path, module.path);
        }
        
        this.imports.push({
            path,
            line: moduleImport(path),
        });
    }
    
    protected get importLines() {
        return this.imports.map(({ line }) => line).join('\n');
    }
    
    public write() {
        writeToPathSync(this.path, this.importLines);
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
            imports.push(module.line);
        }
        
        if (imports.length === 0) {
            return;
        }
        
        const template = this.insertImportTemplate(content, imports);
        writeToPathSync(this.path, template);
    }
    
    protected insertImportTemplate(originalContent: string, imports: string[]) {
        const TERMINATION_LINE = `/** End of vite auto-imports **/`;
        let patchedContent = originalContent;
        if (!originalContent.includes(TERMINATION_LINE)) {
            patchedContent = [
                `/**`,
                ` * These modules are automatically imported by jorgenvatle:vite.`,
                ` * You can commit these to your project or move them elsewhere if you'd like,`,
                ` * but they must be imported somewhere in your Meteor mainModule.`,
                ` *`,
                ` * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages`,
                ` **/`,
                TERMINATION_LINE,
                originalContent,
            ].join('\n');
        }
        
        return patchedContent.replace(
            TERMINATION_LINE,
            [imports, TERMINATION_LINE].flat().join('\n')
        )
    }
}

type ModuleImport = {
    path: string;
}