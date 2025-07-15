import { formatErrorMeta, LoggerInstance } from '/server/util';
import FS from 'node:fs';
import { builtinModules } from 'node:module';
import Path from 'node:path';
import pc from 'picocolors';

const ROOT_DIR = '/home/jorgen/projects/meteor-vite/examples/vue';
const NODE_MODULES = Path.join(ROOT_DIR, 'node_modules/');

function buildPath(path: string): ModulePath {
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
    if (path.startsWith('node:')) {
        return {
            type: 'standard-library',
            path: path.replace('node:', ''),
        }
    }
    
    if (builtinModules.includes(path)) {
        return {
            type: 'standard-library',
            path,
        }
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

function resolvePaths(importPath: string, rootDir = ROOT_DIR): ResolvedModulePaths {
    const { path, type } = buildPath(importPath);
    return {
        type,
        path,
        relativePath: Path.relative(rootDir, path),
        importPath,
        rootDir,
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
        super(`${module.path.replace(ROOT_DIR, pc.dim(ROOT_DIR))}`, module);
        this.name = 'FileNotFound';
    }
}

interface ModulePath {
    type: 'local' | 'absolute' | 'node-module' | 'standard-library',
    path: string;
}

interface ResolvedModulePaths extends ModulePath{
    relativePath: string;
    rootDir: string;
    importPath: string;
}

export class ResolvedModule implements ResolvedModulePaths {
    public loggable = true;
    public readonly type: ModulePath['type'];
    public readonly path: string;
    public readonly isValid: boolean;
    public readonly rootDir: string;
    public readonly importPath: string;
    public readonly relativePath: string;
    protected readonly packageRoot?: string;
    readonly #logger: LoggerInstance;
    
    constructor({ path, relativePath, rootDir, importPath, type }: ResolvedModulePaths) {
        this.relativePath = relativePath;
        this.rootDir = rootDir;
        this.type = type;
        this.path = path;
        this.importPath = importPath;
        
        if (this.type === 'node-module') {
            this.packageRoot = this.importPath.split(Path.sep)[0];
        }
        
        if (this.type === 'standard-library') {
            this.loggable = false;
        }
        
        const initLogger = (status: 'valid' | 'invalid') => {
            const color = {
                valid: pc.green,
                invalid: pc.red,
            }[status]
            const statusLabel = color(`(${status})`);
            const padding = ' '.repeat(Math.max(1, 70 - importPath.length - status.length - this.type.length))
            const prefix = [
                pc.dim(`[${pc.bold(this.type)}]`),
            ].join('')
            const logger = new LoggerInstance({ prefix });
            if (this.loggable) {
                logger.debug(`${pc.reset(importPath)} ${padding + statusLabel}`);
            }
            return logger;
        }
        
        try {
            this.verifyModule();
            this.isValid = true;
            this.#logger = initLogger('valid');
        } catch (error) {
            this.isValid = false;
            this.#logger = initLogger('invalid');
        }
    }
    
    protected get packageJson(): ResolvedModule | null {
        if (!this.packageRoot) {
            return null;
        }
        return this.resolve('package.json');
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
        this.#logger.debug('package.json export path:', { exportPath });
        return this.resolve(exportPath);
    }
    
    protected resolve(path: string): ResolvedModule {
        const target = Path.join(this.path, path);
        const root = Path.dirname(this.path);
        return new ResolvedModule(resolve(Path.relative(root, target)));
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
        if (!this.packageJson) {
            throw new ModuleResolverError('No package.json path available!', this);
        }
        return JSON.parse(this.packageJson.getText());
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

export function resolve(importPath: string, rootDir?: string): ResolvedModule {
    const module = new ResolvedModule(resolvePaths(importPath, rootDir));
    
    if (module.isValid) {
        return module;
    }
    
    if (module.type === 'node-module') {
        return module.getMainExport();
    }
    
    module.verifyModule();
    return module;
}
