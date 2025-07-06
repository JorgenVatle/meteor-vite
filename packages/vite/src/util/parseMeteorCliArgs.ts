import Logger from './Logger';

/**
 * Parse CLI params for `meteor` command.
 *
 * This function is only usable within the context of the build plugin.
 * Other contexts will only resolve params sent to Meteor's internal worker
 * threads.
 *
 * Used to prevent commands like `meteor update` and `meteor add` from
 * triggering a Vite build process.
 */
export function parseMeteorCliArgs() {
    const [_nodePath, _meteorTool, ...meteorArgs] = process.argv;
    const divider = '-'.repeat(120);
    Logger.debug(
        `\n${divider}`,
        {
            'Meteor process start args': [_nodePath, _meteorTool, ...meteorArgs],
            'Meteor args': meteorArgs,
        },
        `\n${divider}\n`
    );
    
    let useBuildPlugin = false;
    
    // $ meteor build
    if (meteorArgs.includes('build')) {
        useBuildPlugin = true;
    }
    
    // $ meteor [without args, which defaults to 'run']
    // $ meteor run
    if (!meteorArgs.length || meteorArgs.includes('run')) {
        useBuildPlugin = true;
    }
    
    // $ meteor --production
    if (meteorArgs.includes('--production')) {
        useBuildPlugin = true;
    }
    
    // $ meteor lint
    if (meteorArgs.includes('lint')) {
        useBuildPlugin = true;
    }
    
    // $ meteor profile
    if (meteorArgs.includes('profile')) {
        useBuildPlugin = true;
    }
    
    // $ meteor test
    if (meteorArgs.includes('test')) {
        useBuildPlugin = true;
    }
    
    const VITE_METEOR_DISABLED = process.env.VITE_METEOR_DISABLED ?? process.env.METEOR_VITE_DISABLED ?? 'false';
    try {
        // Allow use of environment variables to forcefully disable the meteor-vite build plugin
        if (JSON.parse(VITE_METEOR_DISABLED)) {
            Logger.warn(`MeteorVite build plugin disabled by environment variable: ${VITE_METEOR_DISABLED}`);
            useBuildPlugin = false;
        }
    } catch (error) {
        Logger.warn(
            `Failed to parse METEOR_VITE_DISABLED environment variable. Make sure you use a JSON-serializable value (1, 0, true, false).`,
            error, { VITE_METEOR_DISABLED }
        );
    }
    
    return {
        args: meteorArgs,
        useBuildPlugin,
    };
}