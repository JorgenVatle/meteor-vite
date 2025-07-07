/// <reference types="vite/client" />
import { Logger } from '@/utilities/server';

export async function initializeViteDevServer() {
    /**
     * This function is available in production and will be called if Meteor is
     * started with a non-production NODE_ENV. This prevents Meteor from
     * attempting to start the Vite dev server when running a completed
     * production bundle as that is likely not desired behavior and won't work
     * anyway since dev dependencies aren't available.
     */
    if (import.meta?.env?.MODE === 'production') {
        Logger.info('Prevented the Vite dev server from firing up, as you are already running a production build.');
        return;
    }
    await import ('@/server-entry/development');
}

