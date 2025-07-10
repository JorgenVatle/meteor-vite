import FS from 'fs';
import { execSync } from 'child_process';
import Path from 'path';
import { fileURLToPath } from 'node:url';

const dirname = Path.dirname(fileURLToPath(import.meta.url));
const dist = Path.join(dirname, '..', 'dist');
const entrypoint = Path.join(dist, 'bin', 'entrypoint.mjs');

if (!FS.existsSync(entrypoint)) {
    console.log([
        '\n',
        'Looks like this is the first time you are running this command.',
        `Missing binary at ${entrypoint}.`,
        '',
        'Running tsup to build the package...',
        '\n',
    ].join('\n'));
    execSync('npx tsup', {
        stdio: 'inherit',
    })
}