import { CommandDefinition } from '@/lib/CommandDefinition';
import { spawn } from 'node:child_process';
import pc from 'picocolors';
import Readline from 'readline';

const DEFAULTS = {
    baseUrl: process.cwd() + '/',
    replacement: '',
}

export default [
    new CommandDefinition('rewrite-file-urls', {
        title: 'Rewrite Node.js file URLs',
        description: 'Parses stdio to rewrite file URLs. Primarily to handle stack traces with absolute paths that don\'t correctly map to the current filesystem.',
        fields: {
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
                multiple: true,
                optional: true,
            },
        },
        handler: async ({ replacement, run, baseUrl }) => {
            const search = `file://${baseUrl}`;
            const replace = `file://${replacement}`;
            
            function processLine(io: 'log' | 'error') {
                const log = console[io];
                return (line: string) => log(line.replace(search, replace));
            }
            
            console.log([
                '\n',
                `[Rewriting file URLs from ${search} to: ${replace}]`,
                '\n',
            ].join('\n'));
            
            if (!run) {
                const readline = Readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    terminal: false,
                });
                
                readline.on('line', processLine('log'));
                return;
            }
            
            const [command, ...params] = run;
            const child = spawn(command, params);
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
                console.log(`Run command "${run.join(' ')}" exited with code: `, process.exitCode);
            });
        }
    })
]