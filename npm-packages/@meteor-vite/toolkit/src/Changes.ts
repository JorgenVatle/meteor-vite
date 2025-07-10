import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import { execSync } from 'node:child_process';
import Path from 'node:path';

export class Changes {
    constructor(
        protected readonly rootDir: string,
        protected readonly options: Options = {
            saveBuildHash: true,
        }
    ) {}
    
    public async buildIfChanged() {
        const lastHash = await FS.readFile(Path.join(this.rootDir, '.build-hash'), 'utf8').catch(() => 'N/A');
        const currentHash = await this.checkChanges();
        if (lastHash === currentHash) {
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
    
    public async checkChanges() {
        const hash = await this.globHash({
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
            await FS.writeFile(Path.join(this.rootDir, '.build-hash'), hash);
        }
        
        return hash;
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
    }) {
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
        
        
        const result = await hash([contentHashes, fileNameHashes].flat().join(), { algorithm: 'sha1' });
        console.log(`Hash: ${result}`);
        
        if (this.options.detailedLogging) {
            console.log({ files, fileNames });
        }
        
        console.log('\n');
        
        return result;
    }
}


type Options = {
    detailedLogging?: boolean;
    saveBuildHash?: boolean;
}