import { formatErrorMeta } from '/server/util';
import FS from 'node:fs';
import Path from 'node:path';

const ROOT_DIR = '/home/jorgen/projects/meteor-vite/examples/vue';

function buildPath(path: string): ResolvedImport {
    if (path.startsWith('.')) {
        return {
            type: 'local',
            path: Path.resolve(
                ROOT_DIR,
                'server',
                path
            )
        };
    }
    if (path.startsWith('/')) {
        return {
            type: 'absolute',
            path: path,
        };
    }
    return {
        type: 'node-module',
        path: Path.resolve(
            ROOT_DIR,
            'node_modules',
            path
        )
    }
}

class ModuleResolverError extends Error {
    constructor(message: string, module: ResolvedModule) {
        super(formatErrorMeta(`[${module.type}] ${message}`, module));
        this.name = 'ModuleResolverError';
    }
}

class FileNotFound extends ModuleResolverError {
    constructor(module: ResolvedModule) {
        super(`${module.path}`, module);
        this.name = 'FileNotFound';
    }
}

type ResolvedImport = {
    type: 'local' | 'absolute' | 'node-module',
    path: string
};

export class ResolvedModule implements ResolvedImport {
    public readonly type: ResolvedImport['type'];
    public readonly path: string;
    protected readonly relativePath: string;
    public readonly isValid: boolean;
    
    constructor(public readonly importPath: string) {
        const { path, type } = buildPath(importPath);
        this.relativePath = Path.relative(ROOT_DIR, path);
        this.type = type;
        this.path = path;
        
        try {
            this.verifyModule();
            this.isValid = true;
        } catch (error) {
            this.isValid = false;
        }
    }
    
    public getMainExport() {
        const { exports } = this.getPackageJson();
        if (!exports) {
            throw new ModuleResolverError('Missing exports field in package.json', this);
        }
        let exportPath = null;
        if (exports['.']) {
            exportPath = unwrapExportField(exports['.']);
        }
        if (!exportPath) {
            throw new ModuleResolverError('Missing default export in package.json', this);
        }
        return resolve(
            Path.join(
                this.relativePath,
                exportPath
            )
        )
    }
    
    public exists() {
        return FS.existsSync(this.path);
    }
    
    public verifyModule() {
        if (!this.exists()) {
            throw new FileNotFound(this);
        }
        if (FS.statSync(this.path).isDirectory()) {
            throw new ModuleResolverError(`Cannot read directory: ${this.relativePath}`, this);
        }
    }
    
    public getText() {
        this.verifyModule();
        return FS.readFileSync(
            this.path,
            'utf-8'
        )
    }
    
    public getPackageJson(): PackageJson {
        const moduleRoot = this.importPath.split('/')[0];
        const packageJson = resolve(Path.join(moduleRoot, 'package.json'));
        return JSON.parse(packageJson.getText());
    }
}

function unwrapExportField(field: ExportField) {
    if (typeof field === 'string') {
        return field;
    }
    if (Array.isArray(field)) {
        return field[0];
    }
    return field.import;
}

type PackageJson = {
    name: string;
    main?: string;
    exports?: PackageExports;
}

type PackageExports = {
    [key: string]: ExportField;
}

type ExportField = string | string[] | {
    types?: string | string[],
    import?: string,
    require?: string,
    node?: string,
    browser?: string,
    default?: string
}

export function resolve(importPath: string) {
    return new ResolvedModule(importPath);
}
