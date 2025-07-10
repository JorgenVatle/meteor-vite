import { Commands } from '@/Commands';
import { CommandFailure, CommandNotFound, MissingCommandArguments } from '@/errors/CommandFailure';

try {
    const [_nodePath, _scriptPath, command, rootDir] = process.argv;
    
    if (!command) {
        throw new CommandNotFound(`You need to specify a command to run. E.g. ${_scriptPath} build-if-changed`);
    }
    
    if (!rootDir) {
        throw new MissingCommandArguments(`You need to specify a root directory path to run this command. E.g. ${_scriptPath} ./npm-packages/meteor-vite`);
    }
    
    await Commands.run(command, { rootDir });
} catch (error) {
    if (error instanceof CommandFailure) {
        console.error(error.message);
        process.exit(1);
    }
    throw error;
}
