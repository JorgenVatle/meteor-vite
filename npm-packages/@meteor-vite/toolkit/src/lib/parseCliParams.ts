import { CommandNotFound, MissingCommandArguments } from '@/errors/CommandFailure';
import { Highlight } from '@/lib/Highlight';
import { ProjectCompiler } from '@/ProjectCompiler';
import process from 'node:process';

export function parseCliParams(params = process.argv): ParsedArgs {
    const [_nodePath, _scriptPath, command, rootDir = '.'] = params;
    const exampleCommand = Highlight.command('build-if-changed', ['/npm-packages/meteor-vite']);
    
    if (!command) {
        throw new CommandNotFound(`You need to specify a command to run.\nE.g. ${exampleCommand}`);
    }
    
    if (!rootDir) {
        throw new MissingCommandArguments(`You need to specify a root directory path to run this command.\nE.g. ${exampleCommand}`);
    }
    
    return {
        command,
        options: parseOptions(rootDir, params.slice(4)),
    }
}

function parseOptions(rootDir: string, args: string[]) {
    return {
        compiler: new ProjectCompiler(rootDir, ProjectCompiler.options.parse(args))
    }
}

interface ParsedArgs {
    command: string;
    options: CommandOptions;
}

export interface CommandOptions extends ReturnType<typeof parseOptions> {}