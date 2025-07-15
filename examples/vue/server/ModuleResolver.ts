import FS from 'node:fs';
import Path from 'node:path';
import pc from 'picocolors';

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

class FileNotFound extends Error {
    constructor(module: ResolvedModule) {
        super(`[${module.type}] ${module.importPath} (${pc.dim(module.path)})`);
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
    
    constructor(public readonly importPath: string) {
        const { path, type } = buildPath(importPath);
        this.relativePath = Path.relative(ROOT_DIR, path);
        this.type = type;
        this.path = path;
    }
    
    public exists() {
        return FS.existsSync(this.path);
    }
    
    public getText() {
        if (!this.exists()) {
            throw new FileNotFound(this);
        }
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
