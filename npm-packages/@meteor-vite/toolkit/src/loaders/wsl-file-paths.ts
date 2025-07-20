import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

const WSL_ROOT = {
    windows: process.env.WSL_ROOT_WINDOWS || '//wsl.localhost/Ubuntu/',
    wsl: '/',
};

const prepareStackTrace = Error.prepareStackTrace;

Error.prepareStackTrace = (err, structuredStackTrace) => {
    if (!prepareStackTrace) {
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
    }
    const stack = prepareStackTrace(err, structuredStackTrace);
    if (typeof stack !== 'string') {
        console.error('Unexpected stack trace type', { stack });
        return stack;
    }
    
    return stack.split(/[\r\n]/).map((line) => {
        const path = getPathFromStackLine(line);
        if (!path) {
            return line + pc.yellow(' (Failed to extract path)');
        }
        
        const { url } = wslPath(path);
        
        return line.replace(path, url);
    }).join('\n');
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

function getPathFromStackLine(line: string): string | undefined {
    const { path } = line.match(/^\s+at\s+\S+\s\((?<path>.*):\d+:\d+\)$/)?.groups || {};
    
    return path;
}

function wslPath(fileName: string | undefined) {
    if (!fileName) {
        return { path: '<unknown>', url: '<unknown>' };
    }
    try {
        const fileUrl = filePathToUrl(fileName);
        const path = fileURLToPath(fileUrl).replace(/^\//, WSL_ROOT.windows);
        const url = `file://${path}`;
        return { path, url };
    } catch (error) {
        let errorMessage = 'Unexpected error type';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        const name = `<[[ error resolving WSL path: ${errorMessage} ]]>`;
        return {
            path: name,
            url: name,
        }
    }
}