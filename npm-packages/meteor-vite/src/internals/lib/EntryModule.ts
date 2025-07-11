import { writeToPathSync } from '@/internals/lib/writeToPathSync';
import { hasModuleImport, moduleImport } from '@/utilities/server';
import FS from 'node:fs';
import Path from 'path';

export class EntryModule {
    protected readonly imports: (ModuleImport & { line: string })[] = [];
    protected readonly dirname: string;
    constructor(public readonly path: string) {
        this.dirname = Path.dirname(path);
    }
    
    public addImport(module: ModuleImport) {
        let path = module.path;
        
        // Importing a file directly (not a node module)
        if (module.path.startsWith('.') || module.path.startsWith('/')) {
            path = Path.relative(this.dirname, module.path);
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
        const content = this.getContent();
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
    
    protected getContent() {
        this.prepare();
        const content = FS.readFileSync(this.path, 'utf-8');
        return this.stripOldImports(content);
    }
    
    protected insertImportTemplate(originalContent: string, imports: string[]) {
        let content = originalContent;
        
        OLD_TERMINATION_LINES.forEach(line => {
            content = content.replaceAll(line, TERMINATION_LINE);
        })
        
        if (!content.includes(TERMINATION_LINE)) {
            content = [
                `/**`,
                ` * These modules are automatically imported by jorgenvatle:vite.`,
                ` * You can commit these to your project or move them elsewhere if you'd like,`,
                ` * but they must be imported somewhere in your Meteor mainModule.`,
                ` *`,
                ` * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages`,
                ` **/`,
                TERMINATION_LINE,
                content,
            ].join('\n');
        }
        
        return content.replace(
            TERMINATION_LINE,
            [imports, TERMINATION_LINE].flat().join('\n')
        )
    }
    
    protected stripOldImports(_content: string) {
        const OLD_IMPORTS = [
            '../_vite-bundle/server/_entry.mjs',
        ];
        const contentLines = _content.split(/[\r\n]/);
        return contentLines.filter(line => {
            for (const oldImport of OLD_IMPORTS) {
                if (line.includes(oldImport)) {
                    return false;
                }
            }
            return true;
        }).join('\n');
    }
    
    public prepare() {
        if (FS.existsSync(this.path)) {
            return;
        }
        FS.mkdirSync(this.dirname, { recursive: true });
        FS.writeFileSync(this.path, '// Created by Meteor-Vite\n');
    }
    
    public clean() {
        try {
            FS.rmSync(this.dirname, { recursive: true, force: true });
        } catch (error) {
            // Probably safe to ignore
            console.warn(`Failed to clean: ${error.message}`);
        } finally {
            this.prepare();
        }
    }
}

const TERMINATION_LINE = `/** End of vite auto-imports **/`;
const OLD_TERMINATION_LINES = [
    '/** End of vite-bundler auto-imports **/',
]

type ModuleImport = {
    path: string;
}