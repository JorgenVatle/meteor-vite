/**
 * Rewrite file URLs to handle stack traces with absolute paths that don't
 * correctly map to the current filesystem.
 *
 * Primarily to map e.g. WSL file paths to Windows-compatible filepath.
 *
 * @example Usage from the terminal
 * node ./bar.js  2>&1 | rewrite-file-urls '//wsl$/Ubuntu'
 *
 * @example Stack trace
 * // input (Not resolvable by Windows)
 * Error: ...
 * at (file:///home/foo/bar.js:13:37)
 *
 * // output (Valid Windows path)
 * Error: ...
 * at (file:///wsl$/Ubuntu/foo/bar.js:13:37)
 */

import Readline from 'readline';
import { parse } from 'ts-command-line-args';

const { replacement, baseUrl } = parse(
    {
        baseUrl: {
            type: String,
            defaultValue: '/',
            description: 'Base URL to replace. Defaults to / (file://<baseUrl>)'
        },
        replacement: {
            type: String,
            defaultValue: '//wsl.localhost/Ubuntu',
            description: 'Replacement for file:// URLs. Defaults to //wsl.localhost/Ubuntu. (file://<replacement>)'
        }
    },
    {
        helpArg: 'help',
        headerContentSections: [{ header: 'Replace File URLs', content: 'Rewrite file URLs to handle stack traces with absolute paths that don\'t correctly map to the current filesystem.' }],
        stopAtFirstUnknown: true,
    }
)

const readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

const search = `file://${baseUrl}`;
const replace = `file://${replacement}`;

console.log([
    '\n',
    `[Rewriting file URLs from ${search} to: ${replace}]`,
    '\n',
].join('\n'));

readline.on('line', (line) => {
    console.log(line.replace(search, replace));
});
