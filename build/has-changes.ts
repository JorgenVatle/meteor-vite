import FS from 'fs/promises';
import { globby } from 'globby';
import { hash } from 'hasha';
import Path from 'node:path';

export async function checkChanges(rootDir: string) {
    const hash = await globHash([
        Path.join(rootDir, 'src'),
        Path.join(rootDir, 'tsconfig.json'),
    ]);
    await FS.writeFile(Path.join(rootDir, '.build-hash'), hash);
    return hash;
}

async function globHash(patterns: string[]) {
    const startTime = Date.now();
    const files = await globby(patterns);
    files.sort();
    
    const hashes = await Promise.all(files.map(async (file) => {
        const buffer = await FS.readFile(file);
        return hash(buffer, { algorithm: 'md5' });
    }));
    
    console.log(`\n\nComputed hash for build in ${Date.now() - startTime}ms\n\n`);
    return hash(hashes.join());
}