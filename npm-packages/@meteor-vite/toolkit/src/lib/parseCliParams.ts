import { CommandNotFound, MissingCommandArguments } from '@/errors/CommandFailure';
import { Highlight } from '@/lib/Highlight';
import process from 'node:process';

export function parseCliParams(params = process.argv): ParsedArgs {
    const [_nodePath, _scriptPath, command, rootDir] = params;
    const exampleCommand = Highlight.command('build-if-changed', ['/npm-packages/meteor-vite']);
    
    if (!command) {
        throw new CommandNotFound(`You need to specify a command to run. E.g. ${exampleCommand}`);
    }
    
    if (!rootDir) {
        throw new MissingCommandArguments(`You need to specify a root directory path to run this command. E.g. ${exampleCommand}`);
    }
    
    return {
        command,
        options: {
            rootDir,
            watch: params.includes('--watch'),
        }
    }
}

interface ParsedArgs {
    command: string;
    options: CommandOptions;
}

export interface CommandOptions {
    rootDir: string;
    watch?: boolean;
}