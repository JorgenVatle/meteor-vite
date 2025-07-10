import { Commands } from '@/Commands';

const [_nodePath, _scriptPath, command, rootDir] = process.argv;

if (!command) {
    throw `You need to specify a command to run. E.g. ${_scriptPath} build-if-changed`;
}

if (!rootDir) {
    throw `You need to specify a root directory path to run this command. E.g. ${_scriptPath} ./npm-packages/meteor-vite`;
}


await Commands.run(command, { rootDir });