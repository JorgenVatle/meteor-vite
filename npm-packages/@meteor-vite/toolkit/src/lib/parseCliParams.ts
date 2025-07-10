export function parseCliParams(): { rootDir: string } {
    const [_nodePath, _scriptPath, rootDir] = process.argv;
    
    if (!rootDir) {
        throw `You need to specify a root directory path to run this command. E.g. ${_scriptPath} ./npm-packages/meteor-vite`;
    }
    
    return {
        rootDir,
    }
}