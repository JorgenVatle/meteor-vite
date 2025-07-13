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

import { spawn } from 'node:child_process';
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
        run: {
            description: 'Run the command and pipe the output to this script. By default, this script will read from stdin and write to stdout.',
            type: String,
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

const search = `file://${args.baseUrl}`;
const replace = `file://${args.replacement}`;

console.log([
    '\n',
    `[Rewriting file URLs from ${search} to: ${replace}]`,
    '\n',
].join('\n'));


function processLine(io: 'log' | 'error') {
    const log = console[io];
    return (line: string) => log(line.replace(search, replace));
}

if (args.help) {}
else if (args.run) {
    const child = spawn(args.run)
    const stdout = Readline.createInterface({
        input: child.stdout,
    });
    const stderr = Readline.createInterface({
        input: child.stderr,
    });
    
    stdout.on('line', processLine('log'));
    stderr.on('line', processLine('error'));
    
    child.on('exit', (code) => {
        process.exitCode = code || 0;
        console.log(`Run command "${args.run}" exited with code: `, process.exitCode);
    });
} else {
    const readline = Readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    
    readline.on('line', processLine('log'));
}
