import { Parser } from '@/lib/CommandLineArgs/defineParser';
import { GlobalConfig } from '@/lib/GlobalConfig';
import { Highlight } from '@/lib/Highlight';
import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import Path from 'node:path';
import * as process from 'node:process';
import { inspect } from 'node:util';
import pc from 'picocolors';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';

type Options = typeof parser._outputType;
const parser = new Parser({
    rootDir: {
        type: String,
        defaultOption: true,
        defaultValue: '.',
    },
    verbose: {
        description: 'Print full summary of last build and changes to console',
        defaultValue: false,
    },
    watch: {
        description: 'Watch for changes and rebuild on change',
        defaultValue: false,
    },
    summary: {
        description: 'Log a summary of generated hashes to the console',
        defaultValue: true,
    },
    force: {
        description: 'Build regardless of whether there were any changes since last build.',
        defaultValue: envFlag('FORCE_BUILD'),
    },
})

export class ProjectCompiler {
    public readonly filePath;
    protected readonly rootDir: string;
    protected packageJson?: PackageJSON;
    
    public static readonly parser = parser;
    
    constructor(
        public readonly options: Options,
    ) {
        if (GlobalConfig.debug) {
            console.log(options);
        }
        this.rootDir = options.rootDir;
        this.filePath = {
            buildInfo: Path.join(this.rootDir, 'dist', '.build-info.json'),
            packageJson: Path.join(this.rootDir, 'package.json'),
            cwd: process.cwd(),
        }
    }
    
    /**
     * Run the build script if the current root directory has seen changes since
     * last build.
     */
    public async build() {
        const startTime = Date.now();
        const { changed, changes } = await this.getHash();
        
        
        if (this.options.force) {
            console.log(pc.bgYellow(' Forcing build due to FORCE_BUILD (--force) environment variable '));
        } else if (!changed && !this.options.watch) {
            console.log(pc.bgBlackBright(pc.whiteBright(' No changes detected, skipping build ')));
            return;
        }
        
        await this.logLabel('Building');
        
        console.log('Detected changes: %s', ['', changes].flat().join('\n - '));
        console.log('Starting build...');
        
        await this._build();
        const durationMs = Date.now() - startTime;
        
        await this.saveBuildInfo({
            durationMs,
            timestamp: Date.now(),
        });
    }
    
    public async logLabel(_label: string, color = pc.bgGreen) {
        const { name } = await this.getProjectInfo();
        let label = `${pc.white(` ${_label} `)}`;
        label = color(label);
        label = pc.bold(label);
        const packageName = pc.underline(pc.white(name));
        
        console.log(
            '\n\n%s',
            pc.gray(`${label} ${packageName}`),
        );
    }
    
    protected async _build() {
        try {
            process.chdir(this.rootDir);
            const { build } = await import('tsup');
            
            await build({
                watch: this.options.watch,
            });
        } finally {
            process.chdir(this.filePath.cwd);
        }
    }
    
    public async getProjectInfo(): Promise<PackageJSON> {
        if (this.packageJson) {
            return this.packageJson;
        }
        const content = await FS.readFile(this.filePath.packageJson, 'utf8');
        return this.packageJson = JSON.parse(content);
    }
    
    protected relativeTime(timestamp: number) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} days ago`;
        }
        if (hours > 0) {
            return `${hours} hours ago`;
        }
        if (minutes > 0) {
            return `${minutes} minutes ago`;
        }
        if (seconds > 0) {
            return `${seconds} seconds ago`;
        }
        return 'just now';
    }
    
    /**
     * Retrieve build info from last build.
     * @protected
     */
    public async getLastBuildInfo(): Promise<BuildInfo> {
        const buildInfo = await FS.readFile(this.filePath.buildInfo, 'utf8').catch((error) => {
            console.warn(`Failed to read build info file: ${error.message}`);
            return JSON.stringify({
                hash: null,
                error: error.stack || error.message || error,
            });
        });
        
        try {
            return JSON.parse(buildInfo);
        } catch (error) {
            console.error(`Failed to parse build info file: ${this.filePath.buildInfo}:`, { buildInfo });
            throw error;
        }
    }
    
    /**
     * Save info from last build to file for reference in conditional build command
     * @param buildInfo
     */
    public async saveBuildInfo(buildInfo: Omit<BuildInfo, keyof BuildHashes>) {
        const content = Object.assign(
            await this.getHash(),
            buildInfo
        );
        try {
            await FS.mkdir(Path.dirname(this.filePath.buildInfo), { recursive: true });
            await FS.writeFile(
                this.filePath.buildInfo,
                JSON.stringify(content, null, 2)
            );
            return content;
        } catch (error) {
            console.error(`Failed to write build info file: ${this.filePath.buildInfo}:\n ${inspect(content, { colors: true })}`);
            throw error;
        }
    }
    
    public async clean() {
        const path = Path.join(this.rootDir, 'dist');
        
        if (!await FS.lstat(path).catch(() => false)) {
            console.log(pc.bgBlackBright(pc.whiteBright(` Nothing to clean `)), this.rootDir, '\n');
            return;
        }
        
        console.log(pc.bgYellow(pc.whiteBright(` Cleaning up `)), this.rootDir + pc.bold(pc.yellow('/dist')), '\n');
        await FS.rm(Path.join(this.rootDir, 'dist'), { recursive: true });
    }
    
    /**
     * Check whether the current root directory has changed since last build.
     * Will save a hash of the current directory state to .build-hash
     */
    public async getHash({ logSummary = this.options.summary } = {}): Promise<HashResult> {
        const changes: string[] = [];
        const lastBuild = await this.getLastBuildInfo();
        
        const glob = await this.globHash({
            fileContent: [
                Path.join(this.rootDir, 'src'),
                Path.join(this.rootDir, 'tsconfig.json'),
            ],
            // Used to trigger a re-build if the dist directory is deleted or
            // partially built.
            fileNames: [
                Path.join(this.rootDir, 'dist'),
                // Ignore dts files. These are generated after onSuccess hooks,
                // so file build comparison will always result in a mismatch
                // when hashes are generated with the --watch flag.
                `!**.d.ts`,
                '!**.d.mts',
            ]
        });
        
        if (glob.additionalMetadata) {
            console.log(glob.additionalMetadata);
        }
        
        if (lastBuild.hash) {
            if (lastBuild.fileNamesHash !== glob.fileNamesHash) {
                changes.push('File names changed');
            }
            
            if (lastBuild.fileContentHash !== glob.fileContentHash) {
                changes.push('Source files changed');
            }
            
            if (!changes.length && glob.hash !== lastBuild.hash) {
                changes.push('Build hash changed');
            }
        } else {
            changes.push('No previous build info found, rebuild is necessary');
        }
        
        if (logSummary) {
            const logLines: ([string, string] | string)[] = [];
            await this.logLabel('Build info', pc.bgBlue);
            logLines.push(`Computed ${pc.yellow(glob.fileContentCount)} content and ${pc.yellow(glob.filenameCount)} file name hashes!`);
            logLines.push(['Duration', Highlight.duration(`${glob.durationMs}ms`)]);
            
            if (lastBuild.timestamp) {
                logLines.push([`Last build`, Highlight.duration(this.relativeTime(lastBuild.timestamp))]);
            }
            
            if (changes.length) {
                logLines.push(['\nDetected changes', '']);
                changes.forEach((change) => {
                    logLines.push(` - ${change}`);
                })
                logLines.push('');
            }
            
            logLines.push([`Hash`, Highlight.hash(glob.hash || 'N/A')]);
            
            logLines.forEach((line) => {
                const padding = '';
                if (!Array.isArray(line)) {
                    console.log(pc.bold(padding + line));
                    return;
                }
                const [label, value] = line;
                console.log(`${padding}%s: %s`, pc.bold(label), value)
            });
            
        }
        
        return {
            ...glob,
            changes,
            changed: changes.length > 0,
            lastBuild,
        }
    }
    
    protected async globHash(patterns: {
        /**
         * Glob patterns for files and directories to read and include in the hash.
         */
        fileContent: string[],
        
        /**
         * Optionally include file names in the hash. Used to check whether 'dist/'
         * directories are empty or only partially built. (Glob patterns supported)
         */
        fileNames?: string[]
    }): Promise<GlobHashResult> {
        const startTime = Date.now();
        const files = await globby(patterns.fileContent);
        const fileNames = await globby(patterns.fileNames || []);
        
        files.sort();
        fileNames.sort();
        
        const contentHashes = await Promise.all(files.map(async (file) => {
            const buffer = await FS.readFile(file);
            return hash(buffer, { algorithm: 'md5' });
        }));
        
        const fileNameHashes = await Promise.all(fileNames.map(async (fileName) => {
            return hash(fileName, { algorithm: 'md5' });
        }));
        
        
        const [fileContentHash, fileNamesHash] = await Promise.all([
            hash(contentHashes, { algorithm: 'sha1' }),
            hash(fileNameHashes, { algorithm: 'sha1' }),
        ])
        
        const result: GlobHashResult = {
            hash: `${fileContentHash}-${fileNamesHash}`,
            fileNamesHash,
            fileContentHash,
            durationMs: Date.now() - startTime,
            filenameCount: fileNameHashes.length,
            fileContentCount: contentHashes.length,
        };
        
        if (this.options.verbose) {
            result.additionalMetadata = { files, fileNames, result };
        }
        
        return result;
    }
}


interface BuildHashes {
    hash: string | null;
    fileContentHash?: string;
    fileNamesHash?: string;
}

interface GlobHashResult extends Required<BuildHashes> {
    filenameCount: number;
    fileContentCount: number;
    durationMs: number;
    additionalMetadata?: Record<string, unknown>;
}

interface HashResult extends GlobHashResult {
    lastBuild: BuildInfo;
    changes: string[];
    changed: boolean;
}

interface BuildInfo extends BuildHashes {
    timestamp?: number;
    durationMs?: number;
}

type PackageJSON = { name: string, workspaces?: string[] };