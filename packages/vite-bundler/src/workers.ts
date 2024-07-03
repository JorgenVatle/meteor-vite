import type { ChildProcess } from 'concurrently/dist/src/command';
import { fork } from 'node:child_process';
import { Meteor } from 'meteor/meteor';
import Path from 'path';
import FS from 'fs';
import pc from 'picocolors';
import type { WorkerMethod, WorkerResponse, WorkerResponseHooks, MeteorIPCMessage, ProjectJson } from 'meteor-vite';

// Use a worker to skip reify and Fibers
// Use a child process instead of worker to avoid WASM/archived threads error
export function createWorkerFork(hooks: Partial<WorkerResponseHooks>, options?: { detached: boolean }): WorkerInstance {
    if (!FS.existsSync(workerPath)) {
        throw new MeteorViteError([
            `Unable to locate Meteor-Vite workers! Make sure you've installed the 'meteor-vite' npm package.`,
            `Install it by running the following command:`,
            `$  ${pc.yellow('npm i -D meteor-vite')}`
        ])
    }
    validateNpmVersion();
    let shouldKill = true;
    
    if (options?.detached) {
        shouldKill = false;
    }
    
    const child = fork(workerPath, ['--enable-source-maps'], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        cwd,
        detached: options?.detached ?? false,
        env: prepareWorkerEnv(),
    });
    
    const hookMethods = Object.keys(hooks) as (keyof typeof hooks)[];
    hookMethods.forEach((method) => {
        const hook = hooks[method];
        if (typeof hook !== 'function') return;
        (hooks[method] as typeof hook) = Meteor.bindEnvironment(hook);
    })
    
    const workerConfigHook = hooks.workerConfig;
    hooks.workerConfig = (data) => {
        if (typeof workerConfigHook === 'function') {
            workerConfigHook(data);
        }
        const { pid, listening } = data;
        if (listening && process.env.ENABLE_DEBUG_LOGS) {
            console.log('Running Vite worker as a background process..\n  ', [
                `Background PID: ${pid}`,
                `Child process PID: ${child.pid}`,
                `Meteor PID: ${process.pid}`,
                `Is vite server: ${listening}`,
            ].join('\n   '));
        }
        
        if (listening) {
            shouldKill = false;
        } else {
            shouldKill = true;
        }
    }
    
    child.on('message', (message: WorkerResponse & { data: any }) => {
        const hook = hooks[message.kind];
        
        if (typeof hook !== 'function') {
            return console.warn('Meteor: Unrecognized worker message!', { message });
        }
        
        return hook(message.data);
    });
    
    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(event => {
        process.once(event, () => {
            if (!shouldKill) {
                return;
            }
            
            child.kill();
        })
    });
    
    return {
        call(method: Omit<WorkerMethod, 'replies'>) {
            if (!child.connected) {
                console.warn('Oops worker process is not connected! Tried to send message to worker:', method);
                console.log('The Vite server is likely running in the background. Try restarting Meteor. 👍');
                return;
            }
            child.send(method);
        },
        child,
    }
}

export type WorkerInstance = {
    call(method: Omit<WorkerMethod, 'replies'>): void;
    child: ChildProcess;
}

export function isMeteorIPCMessage<
    Topic extends MeteorIPCMessage['topic']
>(message: unknown): message is MeteorIPCMessage  {
    if (!message || typeof message !== 'object') {
        return false;
    }
    if (!('type' in message) || !('topic' in message)) {
        return false;
    }
    if (message?.type !== 'METEOR_IPC_MESSAGE') {
        return false;
    }
    if (typeof message.topic !== 'string') {
        return false;
    }
    return true;
}

class MeteorViteError extends Error {
    constructor(message: string[] | string) {
        if (!Array.isArray(message)) {
            message = [message];
        }
        super(`\n⚡  ${message.join('\n L ')}`);
        this.name = this.constructor.name;
    }
}

export const MIN_METEOR_VITE_NPM_VERSION = { major: 2, minor: 0, patch: 0 };
export const cwd = process.env.METEOR_VITE_CWD ?? guessCwd();
export const workerPath = Path.join(cwd, 'node_modules/meteor-vite/dist/bin/worker.mjs');
export function getProjectPackageJson(): ProjectJson {
    const path = Path.join(cwd, 'package.json');
    
    if (!FS.existsSync(path)) {
        throw new MeteorViteError([
            `Unable to locate package.json for your project in ${pc.yellow(path)}`,
            `Make sure you run Meteor commands from the root of your project directory.`,
            `Alternatively, you can supply a superficial CWD for Meteor-Vite to use:`,
            `$  cross-env METEOR_VITE_CWD="./projects/my-meteor-project/" meteor run`
        ])
    }
    
    return JSON.parse(FS.readFileSync(path, 'utf-8'));
}
function guessCwd () {
    let cwd = process.env.PWD ?? process.cwd()
    const index = cwd.indexOf('.meteor')
    if (index !== -1) {
        cwd = cwd.substring(0, index)
    }
    return cwd
}

function prepareWorkerEnv() {
    const workerEnvPrefix = 'METEOR_VITE_WORKER_';
    const env: Record<string, string | undefined> = {
        FORCE_COLOR: '3',
        ENABLE_DEBUG_LOGS: process.env.ENABLE_DEBUG_LOGS,
        METEOR_LOCAL_DIR: process.env.METEOR_LOCAL_DIR,
    }
    Object.entries(process.env).forEach(([key, value]) => {
        if (!key.startsWith(workerEnvPrefix)) {
            return;
        }
        const unPrefixedKey = key.replace(new RegExp(`^${workerEnvPrefix}`), '');
        env[key] = value;
        env[unPrefixedKey] = value;
    })
    return env;
}

function validateNpmVersion() {
    const packageJson = getProjectPackageJson();
    const version = packageJson.dependencies['meteor-vite'] || packageJson.devDependencies['meteor-vite'];
    const SEMVER_PARSE_REGEX = /(?<major>\d)+\.(?<minor>\d)+\.(?<patch>\d)+/;
    
    if (!version) {
        console.error([
            '⚡  Missing `meteor-vite` in your dependencies! You can install it with the following command:',
            pc.dim(' $ meteor npm i meteor-vite '),
        ].join('\n'))
        return;
    }
    
    let { minor, patch, major } = version.match(SEMVER_PARSE_REGEX)?.groups || {} as Record<'major' | 'minor' | 'patch', number | string | undefined>;
    function logVersionRequirement() {
        const { major, minor, patch } = MIN_METEOR_VITE_NPM_VERSION;
        console.error([
            '⚡  You are using an out of date version of `meteor-vite`.',
            `   Please update it: ${pc.dim(`$ meteor npm i meteor-vite@${major}.${minor}.${patch}`)}`
        ].join('\n'))
    }
    
    if (!major || !minor || !patch) {
        console.warn('⚡  Unrecognized version of the `meteor-vite` npm package.');
        return;
    }
    major = parseInt(major.toString());
    minor = parseInt(minor.toString());
    patch = parseInt(patch.toString());
    
    if (major > MIN_METEOR_VITE_NPM_VERSION.major) {
        return;
    }
    
    if (major < MIN_METEOR_VITE_NPM_VERSION.major) {
        logVersionRequirement();
        return;
    }
    
    if (minor > MIN_METEOR_VITE_NPM_VERSION.minor) {
        return;
    }
    
    if (minor < MIN_METEOR_VITE_NPM_VERSION.minor) {
        logVersionRequirement();
    }
    
    if (patch > MIN_METEOR_VITE_NPM_VERSION.patch) {
        return;
    }
    
    if (patch < MIN_METEOR_VITE_NPM_VERSION.patch) {
        logVersionRequirement();
    }
}
