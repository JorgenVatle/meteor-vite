import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import { execSync } from 'node:child_process';
import Path from 'node:path';

export async function buildIfChanged(rootDir: string, options?: Options) {
    const lastHash = await FS.readFile(Path.join(rootDir, '.build-hash'), 'utf8').catch(() => 'N/A');
    const currentHash = await checkChanges(rootDir, options);
    if (lastHash === currentHash) {
        console.log('No changes detected, skipping build');
        return;
    }
    console.log('Changes detected, running build');
    execSync('npm run build', {
        cwd: rootDir,
        stdio: 'inherit',
        env: Object.assign({
            TSUP_CLEAN: true,
        }, process.env),
    });
}

export async function checkChanges(rootDir: string, options?: Options) {
    const hash = await globHash({
        fileContent: [
            Path.join(rootDir, 'src'),
            Path.join(rootDir, 'tsconfig.json'),
        ],
        // Used to trigger a re-build if the dist directory is deleted or
        // partially built.
        fileNames: [
            Path.join(rootDir, 'dist')
        ]
    }, options);
    await FS.writeFile(Path.join(rootDir, '.build-hash'), hash);
    return hash;
}

async function globHash(
    patterns: {
        /**
         * Glob patterns for files and directories to read and include in the hash.
         */
        fileContent: string[],
        
        /**
         * Optionally include file names in the hash. Used to check whether 'dist/'
         * directories are empty or only partially built. (Glob patterns supported)
         */
        fileNames?: string[]
    },
    options: Options = {}
) {
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
    
    if (options.detailedLogging) {
        console.log({ files, fileNames });
    }
    
    console.log('\n');
    
    return result;
}

type Options = {
    detailedLogging?: boolean;
}