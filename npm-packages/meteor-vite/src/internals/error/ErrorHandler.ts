import ViteLoadRequest, { RefreshNeeded } from '@/plugin/lib/ViteLoadRequest';
import { FatalMeteorViteError, MeteorViteError } from './MeteorViteError';

export function createErrorHandler(fallbackDescription: string, request?: ViteLoadRequest) {
    return async (error: unknown): Promise<never> => {
        const viteError = await formatError(fallbackDescription, error);
        
        if (request) {
            viteError.setContext(request);
        }
        
        if (viteError instanceof RefreshNeeded) {
            return handleRefreshNeeded(viteError);
        }
        
        await viteError.beautify()
        if (error instanceof FatalMeteorViteError) {
            console.error(error);
            process.exit(1);
        }
        
        throw error;
    }
}

function formatError(fallbackDescription: string, error: unknown | Error) {
    if (!(error instanceof Error)) {
        return new MeteorViteError('Received an unexpected error format!', { cause: error });
    }
    
    if (!(error instanceof MeteorViteError)) {
        return new MeteorViteError(fallbackDescription, {
            cause: error,
        })
    }
    
    return error;
}

let lastEmittedWarning = Date.now();

/**
 * Only really gets to this point if the Vite worker times out waiting for Meteor to emit a "client refresh" IPC
 * message.
 * TODO: Forcefully restart Meteor server once the warning is emitted.
 * @param {RefreshNeeded} error
 * @returns {never}
 */
function handleRefreshNeeded(error: RefreshNeeded): never {
    if (1000 < Date.now() - lastEmittedWarning) {
        console.warn(error.message);
        process.emitWarning('Refresh needed!', error.constructor.name);
        lastEmittedWarning = Date.now();
    }
    throw error;
}