import { fileURLToPath } from 'node:url';

const WSL_ROOT = {
    windows: process.env.WSL_ROOT_WINDOWS || '//wsl.localhost/Ubuntu/',
    wsl: '/',
};

Error.prepareStackTrace = (err, structuredStackTrace) => {
    return [
        `${err.name}: ${err.message}`,
        ...structuredStackTrace.map(callSite => {
            const fileName = callSite.getFileName();
            const line = callSite.getLineNumber();
            const col = callSite.getColumnNumber();
            const func = callSite.getFunctionName() || '<anonymous>';
            
            const { url } = wslPath(fileName);
            
            return `    at ${func} (${url}:${line}:${col})`;
        })
    ].join('\n');
};

function filePathToUrl(name: string) {
    if (!name) {
        return '<unknown>';
    }
    if (name.startsWith('file://')) {
        return name;
    }
    return `file://${name}`;
}

function wslPath(fileName: string | undefined) {
    if (!fileName) {
        return { path: '<unknown>', url: '<unknown>' };
    }
    const fileUrl = filePathToUrl(fileName);
    const path = fileURLToPath(fileUrl).replace(/^\//, WSL_ROOT.windows);
    const url = `file://${wslPath}`;
    return { path, url };
}