import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import { execSync } from 'node:child_process';
import Path from 'node:path';

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
            buildInfo: Path.join(this.rootDir, 'dist', '.build-hash'),
        }
    }
    
    /**
     * Run the build script if the current root directory has seen changes since
     * last build.
     */
    public async buildIfChanged() {
        if (!await this.hasChanged()) {
            console.log('No changes detected, skipping build');
            return;
        }
        console.log('Changes detected, running build');
        execSync('npm run build', {
            cwd: this.rootDir,
            stdio: 'inherit',
            env: Object.assign({
                TSUP_CLEAN: true,
            }, process.env),
        });
    }
    
    /**
     * Check if there have been any changes to the project since last build.
     */
    public async hasChanged() {
        const lastBuild = await this.getBuildInfo();
        const { hash } = await this.checkChanges();
        return lastBuild.hash !== hash;
    }
    
    protected async getBuildInfo() {
        const hash = await FS.readFile(this.filePath.buildInfo, 'utf8').catch(() => 'N/A');
        return {
            hash,
        }
    }
    
    /**
     * Check whether the current root directory has changed since last build.
     * Will save a hash of the current directory state to .build-hash
     */
    public async checkChanges() {
        const { hash } = await this.globHash({
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
        
        if (this.options.saveBuildHash ?? true) {
            await FS.writeFile(this.filePath.buildInfo, hash);
        }
        
        return { hash };
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
    }): Promise<HashResult> {
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
        
        
        console.log('\n');
        
        console.log([
            `Computed ${contentHashes.length} content and ${fileNameHashes.length} file name hashes for`,
            `build in ${Date.now() - startTime}ms`,
        ].join(' '));
        
        
        const [fileContentHash, fileNamesHash] = await Promise.all([
            hash(contentHashes, { algorithm: 'sha1' }),
            hash(fileNameHashes, { algorithm: 'sha1' }),
        ])
        
        const result: HashResult = {
            hash: `${fileContentHash}-${fileNamesHash}`,
            fileNamesHash,
            fileContentHash,
        };
        
        console.log(`Hash: ${result.hash}`);
        
        if (this.options.detailedLogging) {
            console.log({ files, fileNames, result });
        }
        
        console.log('\n');
        
        return result;
    }
}


type Options = {
    detailedLogging?: boolean;
    saveBuildHash?: boolean;
}

interface BuildHashes {
    hash: string;
    fileContentHash?: string;
    fileNamesHash?: string;
}

type HashResult = Required<BuildHashes>

interface BuildInfo extends BuildHashes {
    timestamp?: number;
    durationMs?: number;
}