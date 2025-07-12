import FS from 'fs';
import { execSync } from 'child_process';
import Path from 'path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const dirname = Path.dirname(fileURLToPath(import.meta.url));
const rootDir = Path.join(dirname, '..');
const entrypoint = Path.join(rootDir, packageJson.bin.toolkit);

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
    });
    execSync('node ./dist/bin/entrypoint.mjs', {
        stdio: 'inherit',
    })
}