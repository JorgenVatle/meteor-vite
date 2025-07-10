import { CommandNotFound, MissingCommandArguments } from '@/errors/CommandFailure';
import process from 'node:process';

export function parseCliParams(params = process.argv): ParsedArgs {
    const [_nodePath, _scriptPath, command, rootDir] = params;
    
    if (!command) {
        throw new CommandNotFound(`You need to specify a command to run. E.g. ${_scriptPath} build-if-changed`);
    }
    
    if (!rootDir) {
        throw new MissingCommandArguments(`You need to specify a root directory path to run this command. E.g. ${_scriptPath} ./npm-packages/meteor-vite`);
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