import { Commands } from '@/Commands';
import { CommandFailure, CommandNotFound, MissingCommandArguments } from '@/errors/CommandFailure';
import type { CommandArgs } from '@/lib/CommandList';
import * as process from 'node:process';

try {
    const { command, args } = parseParams();
    
    await Commands.run(command, args);
} catch (error) {
    if (error instanceof CommandFailure) {
        console.error(error.message);
        process.exit(1);
    }
    throw error;
}

function parseParams(): Params {
    const [_nodePath, _scriptPath, command, rootDir] = process.argv;
    
    
    if (!command) {
        throw new CommandNotFound(`You need to specify a command to run. E.g. ${_scriptPath} build-if-changed`);
    }
    
    if (!rootDir) {
        throw new MissingCommandArguments(`You need to specify a root directory path to run this command. E.g. ${_scriptPath} ./npm-packages/meteor-vite`);
    }
    
    return {
        command,
        args: {
            rootDir,
            watch: process.argv.includes('--watch'),
        }
    }
}

interface Params {
    command: string;
    args: CommandArgs;
}