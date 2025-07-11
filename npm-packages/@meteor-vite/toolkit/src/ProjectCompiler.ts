import { CommandList } from '@/lib/CommandList';
import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import Path from 'node:path';
import * as process from 'node:process';
import { build } from 'tsup';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';

export class ProjectCompiler {
    protected readonly options: Options;
    protected filePath: {
        buildInfo: string;
    }
    
    public static options = CommandList.defineOptions({
        verbose: {
            default: false,
        },
        watch: {
            default: false,
        }
    });
    
    
    constructor(
        protected readonly rootDir: string,
        options: Partial<Options> = {},
    ) {
        this.options = Object.assign(ProjectCompiler.options.default, options);
        this.filePath = {
            buildInfo: Path.join(this.rootDir, 'dist', '.build-info.json'),
        }
    }
    
    /**
     * Run the build script if the current root directory has seen changes since
     * last build.
     */
    public async build() {
        const startTime = Date.now();
        const { changed } = await this.getHash();
        
        process.chdir(this.rootDir);
        
        if (envFlag('FORCE_BUILD')) {
            console.log('Forcing build due to FORCE_BUILD environment variable');
        } else if (!changed && !this.options.watch) {
            console.log('No changes detected, skipping build');
            return;
        }
        
        await build({
            watch: this.options.watch,
        });
        
        const durationMs = Date.now() - startTime;
        
        await this.saveBuildInfo({
            durationMs,
            timestamp: Date.now(),
        });
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
        
        return JSON.parse(buildInfo);
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
        await FS.writeFile(
            this.filePath.buildInfo,
            JSON.stringify(content, null, 2)
        );
        return content;
    }
    
    /**
     * Check whether the current root directory has changed since last build.
     * Will save a hash of the current directory state to .build-hash
     */
    public async getHash({ logSummary = true } = {}): Promise<HashResult> {
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
            console.log('\n');
            console.log(`Computed ${glob.fileContentCount} content and ${glob.filenameCount} file name hashes!`);
            console.log(`Duration: ${glob.durationMs}ms`);
            
            if (lastBuild.timestamp) {
                console.log(`Last build: ${this.relativeTime(lastBuild.timestamp)}`);
            }
            
            if (changes.length) {
                console.log('\nDetected changes:\n - %s', changes.join('\n - '));
                console.log();
            }
            
            console.log(`Hash: ${glob.hash}`);
            console.log('\n');
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


type Options = ReturnType<typeof ProjectCompiler.options.parse>;

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