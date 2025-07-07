import { MeteorViteError } from '@/error/MeteorViteError';
import type { ResolvedPluginSettings } from '@/types/MeteorVitePluginSettings';
import { Colorize, createLabelledLogger, LabelLogger } from '@/utilities';
import NodeFS, { existsSync } from 'fs';
import FS from 'fs/promises';
import Path from 'path';
import pc from 'picocolors';
import { type Environment, ViteDevServer } from 'vite';
import AutoImportQueue from './meteor/package/AutoImportQueue';
import { isSameModulePath } from './meteor/package/components/MeteorPackage';

export default class ViteLoadRequest {
    
    public lazyMainModulePath?: string;
    public isLazyLoaded: boolean;
    public log: LabelLogger;
    
    constructor(public readonly context: RequestContext) {
        this.isLazyLoaded = false;
        this.log = createLabelledLogger(`[${pc.yellow(context.id.replace('meteor/', ''))}]`);
        
        context.manifest?.resources.forEach((resource) => {
            const isMainModule = resource.fileOptions?.mainModule;
            if (isMainModule) {
                this.lazyMainModulePath = resource.path;
            }
            if (!this.context.file.importPath && isMainModule) {
                this.isLazyLoaded = resource.fileOptions?.lazy || false;
            }
            if (isSameModulePath({
                filepathA: this.context.file.importPath || '',
                filepathB: resource.path,
                compareExtensions: false,
            })) {
                this.isLazyLoaded = resource.fileOptions?.lazy || false;
            }
        });
    };
    
    public static resolveId(id: string): string | undefined {
        if (id.startsWith('meteor/') || id.startsWith('meteor:')) {
            return `\0${id}`;
        }
    }
    
    public static isStubRequest(id: string): boolean {
        return id.startsWith('\0meteor/') || id.startsWith('\0meteor:');
    }
    
    /**
     * Parse an incoming Vite plugin load() request.
     * Builds up the most of the metadata necessary for building up a good Meteor stub template.
     *
     * @param {PreContextRequest} request
     * @return {Promise<ViteLoadRequest>}
     */
    public static async prepareContext(request: PreContextRequest): Promise<ViteLoadRequest> {
        if (!this.isStubRequest(request.id)) {
            throw new MeteorViteStubRequestError('Tried to set up file context for an unrecognized file path!');
        }
        request.id = this.getStubId(request.id);
        const file = this.loadFileData(request);
        const manifest = await this.loadManifest({ file, ...request });
        
        return new ViteLoadRequest({
            file,
            manifest,
            ...request,
        });
    }

    /**
     * Slice off the request raw request identifier we use for determining whether to process the request or not.
     *
     * @example
     * '\0meteor/meteor' -> 'meteor/meteor'
     * '\0meteor:react' -> 'meteor/modules/node_modules/react'
     */
    protected static getStubId(viteId: string): string {
        const importPath = viteId.slice(1);
        if (importPath.startsWith('meteor/')) {
            return importPath;
        }
        
        // Todo: Try to cache the meteor/modules package - reading from it can be expensive for larger projects
        return importPath.replace('meteor:', 'meteor/modules/node_modules/');
    }

    protected static loadFileData({ id, pluginSettings: { meteorStubs }, environment }: PreContextRequest): {
        content: Promise<string>;
        packageId: string;
        importPath?: string;
        sourcePath: string;
        environment: Environment;
        manifestPath: string;
    } {
        const matches = id.match(/(?<packageId>(meteor\/)[\w\-. ]+(:[\w\-. ]+)?)(?<importPath>\/.+)?/)?.groups || {};
        
        /**
         * Base Atmosphere package import This is usually where we find the full package content, even for packages
         * that have multiple entry points.
         * {@link ParsedPackage.packageId}
         */
        const packageId = matches.packageId || `[unknownPackageId:${id}]`;
        
        /**
         * Requested file path inside the package. (/some-module)
         * Used for packages that have multiple entry points or no mainModule specified in package.js.
         * E.g. `import { Something } from `meteor/ostrio:cookies/some-module`
         * @type {string | undefined}
         */
        const importPath: string | undefined = matches.importPath;
        
        const arch = {
            programsDir: 'web.browser',
            manifestFile: 'web.browser.json',
        };
        
        if (environment.name === 'server') {
            arch.manifestFile = 'os.json';
            arch.programsDir = 'server';
        }
        
        const packageName = packageId.replace(/^meteor\//, '');
        const sourceName = packageName.replace(':', '_');
        const sourceFile = `${sourceName}.js`;
        const sourcePath = Path.join(meteorStubs.meteor.buildProgramsPath, arch.programsDir, 'packages', sourceFile);
        const resolverResultCache: ResolverResultCache = JSON.parse(NodeFS.readFileSync(Path.join(
            meteorStubs.meteor.isopackPath,
            '../resolver-result-cache.json',
        ), 'utf-8'));
        const packageVersion = resolverResultCache.lastOutput.answer[packageName];
        const globalMeteorPackagesDir = meteorStubs.meteor.globalMeteorPackagesDir || this.guessMeteorPackagePath();
        
        const manifestPath = {
            local: Path.join(meteorStubs.meteor.isopackPath, sourceName, arch.manifestFile),
            globalCache: Path.join(globalMeteorPackagesDir, sourceName, packageVersion, arch.manifestFile),
        };
        
        /**
         * Raw file content for the current file request.
         * We don't want to await it here to keep things snappy until the content is actually needed.
         */
        const content = FS.readFile(sourcePath, 'utf-8').catch((fsError: Error) => {
            if (globalThis?.MeteorViteRuntimeConfig?.productionPreview) {
                console.warn(`--production flag cannot update package stubs for: ${packageId}`);
                return '// Run server once in dev mode to update package sources';
            }
            throw new MeteorViteStubRequestError(`Unable to read file content: ${fsError.message}`);
        });
        
        return {
            content,
            packageId,
            importPath,
            sourcePath,
            environment,
            manifestPath: NodeFS.existsSync(manifestPath.local)
                          ? manifestPath.local
                          : manifestPath.globalCache,
        };
    }
    
    /**
     * Checks Meteor for an Isopack manifest file.
     * We use this to detect whether a module is lazy-loaded and needs to be forcefully imported and for determining
     * the package's entrypoint.
     *
     * @param {FileData} file
     * @return {Promise<ManifestContent>}
     * @protected
     */
    protected static async loadManifest({ file }: PreContextRequest & { file: FileData }): Promise<ManifestContent | undefined> {
        if (!existsSync(file.manifestPath)) {
            return;
        }
        
        return JSON.parse(await FS.readFile(file.manifestPath, 'utf8')) as ManifestContent;
    }
    
    /**
     * Try to determine the path to Meteor's shared package cache.
     * This is used to retrieve isopack metadata for lazy-loaded packages.
     * @return {string}
     * @protected
     */
    protected static guessMeteorPackagePath(): string {
        const [root, ...parts] = process.argv0.split(/[\/\\]/);
        let packagePath = root || '/';
        
        parts.forEach((part) => {
            if (packagePath.includes('/.meteor/packages/meteor-tool')) {
                return;
            }
            packagePath = Path.posix.join(packagePath, part);
        });
        
        return Path.join(packagePath, '../');
    }
    
    /**
     * Forces an import statement for the current module into the user's Meteor mainModule.
     * Not to be confused with Vite's entrypoint.
     *
     * We do this to work around how Meteor deals with lazy-loaded packages.
     * @return {Promise<void>}
     */
    public async forceImport(): Promise<void> {
        const meteorEntry = Path.resolve(process.cwd(), this.meteorMainModule);
        
        if (!existsSync(meteorEntry)) {
            throw new MeteorViteError(`Unable to resolve Meteor mainModule: ${Colorize.filepath(meteorEntry)} not found!`);
        }
        
        await AutoImportQueue.write({
            meteorEntrypoint: meteorEntry,
            importString: this.context.id,
        }).catch((error) => {
            if (!(error instanceof RefreshNeeded)) {
                throw error;
            }
            if (!this.context.server) {
                throw error;
            }
            
            this.context.server.restart(true);
        });
    }
    
    protected get _meteorMainModule(): string | undefined {
        const mainModule = this.context.pluginSettings.meteorStubs.packageJson!.meteor.mainModule;
        if (this.context.environment.name === 'server') {
            return mainModule.server;
        }
        return mainModule.client;
    }
    
    protected get meteorMainModule(): string {
        if (!this._meteorMainModule) {
            throw new MeteorViteError(`Missing Meteor mainModule for current environment! Make sure you specify mainModule paths in your ${Colorize.filepath('package.json')}`);
        }
        return this._meteorMainModule;
    }
    
    public get cache(): {
        baseDir: string;
        templatePath: string;
        packagePath: string;
        parserPath: string;
        mock: {
            bundleSource: string;
            index: string;
        };
        manifestPath: string;
    } {
        const [meteor, packageBasename] = this.context.file.packageId.replace(':', '_').split('/');
        const baseDir = Path.resolve(Path.join(this.context.pluginSettings.tempDir, 'stubs', this.context.environment.name, packageBasename));
        const templatePath = Path.join(baseDir, this.context.file.importPath || '', 'template.js');
        const packagePath = Path.join(baseDir, 'package.js');
        const parserPath = Path.join(baseDir, 'parsed.json');
        const manifestPath = Path.join(baseDir, 'isopack.json');
        
        // Mock files that can be dropped into meteor-vite's test directory.
        const mock = {
            bundleSource: Path.join(baseDir, '_mock', packageBasename, `package.js.bundle`),
            index: Path.join(baseDir, '_mock', packageBasename, `index.ts`)
        }
        
        return {
            baseDir,
            templatePath,
            packagePath,
            parserPath,
            mock,
            manifestPath,
        }
    }
    
}


/**
 * Load request file metadata. See linked method for documentation for the associated properties.
 * {@link ViteLoadRequest.loadFileData}
 */
export type FileRequestData = ReturnType<typeof ViteLoadRequest['loadFileData']>

interface PreContextRequest {
    id: string;
    pluginSettings: ResolvedPluginSettings;
    server: ViteDevServer;
    environment: Environment;
}

export interface RequestContext extends PreContextRequest {
    manifest?: ManifestContent;
    file: FileData;
}

type FileData = ReturnType<typeof ViteLoadRequest['loadFileData']>;

interface ManifestContent {
    format: string;
    declaredExports: [];
    uses: { 'package': string }[];
    resources: ManifestResource[];
}

interface ManifestResource {
    path: string;
    fileOptions?: { lazy: boolean; mainModule: boolean };
    extension: string;
    file: string;
    offset: number;
    length: number;
    type: string;
    hash: string;
}

type VersionString = `${string}.${string}.${string}`;

interface ResolverResultCache {
    lastInput: {
        dependencies: string[],
        constraints: `${string}@${VersionString}`[],
        previousSolution: Record<string, VersionString>;
    },
    lastOutput: {
        neededToUseUnanticipatedPrereleases: boolean;
        answer: Record<string, VersionString>;
    }
    
}

export class RefreshNeeded extends MeteorViteError {
    constructor(message: string, public readonly loadedPackages: string[]) {
        super(message);
    }
}

class MeteorViteStubRequestError extends MeteorViteError {
}
