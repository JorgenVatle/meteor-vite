import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import Path from 'node:path';
import * as process from 'node:process';
import { build } from 'tsup';
import { envFlag } from '~/meteor-vite/utilities/server/EnvFlag';

export class Changes {
    protected filePath: {
        buildInfo: string;
    }
    
    constructor(
        protected readonly rootDir: string,
        protected readonly options: Options = {
            saveBuildHash: true,
        }
    ) {
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
        const { changed } = await this.findChanges();
        
        process.chdir(this.rootDir);
        
        if (envFlag('FORCE_BUILD')) {
            console.log('Forcing build due to FORCE_BUILD environment variable');
        } else if (!changed) {
            console.log('No changes detected, skipping build');
            return;
        }
        
        await build({});
        
        const durationMs = Date.now() - startTime;
        
        await this.saveBuildInfo({
            durationMs,
            timestamp: Date.now(),
        });
    }
    
    /**
     * Check if there have been any changes to the project since last build.
     */
    public async findChanges(): Promise<ChangeSummary> {
        const { lastBuild, hash, fileNamesHash, fileContentHash, ...info } = await this.getHash();
        const changes: string[] = [];
        
        if (info.additionalMetadata) {
            console.log(info.additionalMetadata);
        }
        
        if (lastBuild.hash) {
            if (lastBuild.fileNamesHash !== fileNamesHash) {
                changes.push('File names changed');
            }
            
            if (lastBuild.fileContentHash !== fileContentHash) {
                changes.push('Source files changed');
            }
            
            if (!changes.length && hash !== lastBuild.hash) {
                changes.push('Build hash changed');
            }
        } else {
            changes.push('No previous build info found, rebuild is necessary');
        }
        
        console.log('\n');
        console.log(`Computed ${info.fileContentCount} content and ${info.filenameCount} file name hashes!`);
        console.log(`Duration: ${info.durationMs}ms`);
        
        if (lastBuild.timestamp) {
            console.log(`Last build: ${this.relativeTime(lastBuild.timestamp)}`);
        }
        
        if (changes.length) {
            console.log('\nDetected changes:\n - ', changes.join('\n - '));
            console.log();
        }
      
        console.log(`Hash: ${hash}`);
        console.log('\n');
        
        return {
            changed: changes.length > 0,
            changes,
            lastBuild,
        }
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
        const buildInfo = await FS.readFile(this.filePath.buildInfo, 'utf8').catch(() => null);
        
        if (!buildInfo) {
            return {
                hash: null,
            }
        }
        
        return JSON.parse(buildInfo);
    }
    
    /**
     * Save info from last build to file for reference in conditional build command
     * @param buildInfo
     */
    protected async saveBuildInfo(buildInfo: Omit<BuildInfo, keyof BuildHashes>) {
        const content = Object.assign(
            await this.getHash(),
            buildInfo
        );
        await FS.writeFile(
            this.filePath.buildInfo,
            JSON.stringify(content, null, 2)
        );
    }
    
    /**
     * Check whether the current root directory has changed since last build.
     * Will save a hash of the current directory state to .build-hash
     */
    public async getHash(): Promise<HashResult> {
        const result = await this.globHash({
            fileContent: [
                Path.join(this.rootDir, 'src'),
                Path.join(this.rootDir, 'tsconfig.json'),
            ],
            // Used to trigger a re-build if the dist directory is deleted or
            // partially built.
            fileNames: [
                Path.join(this.rootDir, 'dist')
            ]
        });
        
        return {
            ...result,
            lastBuild: await this.getLastBuildInfo(),
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
        
        if (this.options.detailedLogging) {
            result.additionalMetadata = { files, fileNames, result };
        }
        
        return result;
    }
}


type Options = {
    detailedLogging?: boolean;
    saveBuildHash?: boolean;
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
}

interface BuildInfo extends BuildHashes {
    timestamp?: number;
    durationMs?: number;
}

interface ChangeSummary {
    changes: string[];
    changed: boolean;
    lastBuild: BuildInfo;
}
