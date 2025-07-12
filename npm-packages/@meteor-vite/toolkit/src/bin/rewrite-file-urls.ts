/**
 * Rewrite file URLs to handle stack traces with absolute paths that don't
 * correctly map to the current filesystem.
 *
 * For example to map WSL file paths to Windows-compatible format.
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

import process from 'node:process';
import pc from 'picocolors';
import Readline from 'readline';
import { parse } from 'ts-command-line-args';

const DEFAULTS = {
    baseUrl: process.cwd() + '/',
    replacement: '',
}

const args = parse(
    {
        baseUrl: {
            type: String,
            defaultValue: DEFAULTS.baseUrl,
            description: `Base 'file://' URL to replace \t ${pc.dim(`Default: ${DEFAULTS.baseUrl}`)}`
        },
        replacement: {
            type: String,
            defaultValue: DEFAULTS.replacement,
            description: `Replacement for provided base URL \t ${pc.dim(`Default: ${DEFAULTS.replacement || '(empty string)'}`)}`,
        },
        help: Boolean,
    },
    {
        helpArg: 'help',
        headerContentSections: [{
            header: 'Replace File URLs',
            content: 'Rewrite file URLs to handle stack traces with absolute paths that don\'t correctly map to the current filesystem.'
        }],
        stopAtFirstUnknown: true,
    }
)

if (!args.help) {
    const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    
    const search = `file://${args.baseUrl}`;
    const replace = `file://${args.replacement}`;
    
    console.log([
        '\n',
        `[Rewriting file URLs from ${search} to: ${replace}]`,
        '\n',
    ].join('\n'));
    
    readline.on('line', (line) => {
        console.log(line.replace(search, replace));
    });
}

