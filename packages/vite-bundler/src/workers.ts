import type { ChildProcess } from 'concurrently/dist/src/command';
import { fork } from 'node:child_process';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Path from 'path';
import FS from 'fs';
import pc from 'picocolors';
import type { WorkerMethod, WorkerResponse, WorkerResponseHooks, MeteorIPCMessage, ProjectJson } from 'meteor-vite';
import type { DDP_IPC } from './api/DDP-IPC';
import { getMeteorRuntimeConfig } from './utility/Helpers';

// Use a worker to skip reify and Fibers
// Use a child process instead of worker to avoid WASM/archived threads error
export function createWorkerFork(hooks: Partial<WorkerResponseHooks>, options?: {
    detached: boolean,
    ipc?: DDP_IPC;
}) {
    if (!FS.existsSync(workerPath)) {
        throw new MeteorViteError([
            `Unable to locate Meteor-Vite workers! Make sure you've installed the 'meteor-vite' npm package.`,
            `Install it by running the following command:`,
            `$  ${pc.yellow('npm i -D meteor-vite')}`
        ])
    }
    
    const child = fork(workerPath, ['--enable-source-maps'], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        cwd,
        detached: options?.detached ?? false,
        env: prepareWorkerEnv({ ipcOverDdp: !!options?.ipc?.active }),
    });
    
    if (options?.detached) {
        child.unref();
    }
    
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
    }
    
    if (options?.ipc?.active) {
        options.ipc.setResponseHooks(hooks);
    }
    
    child.on('message', (message: WorkerResponse & { data: any }) => {
        const hook = hooks[message.kind];
        
        if (typeof hook !== 'function') {
            return console.warn('Meteor: Unrecognized worker message!', { message });
        }
        
        return hook(message.data);
    });
    
    child.on('exit', (code) => {
        if (code || process.env.ENABLE_DEBUG_LOGS) {
            console.warn('Child exited with code:', code);
        }
    })
    
    child.on('error', (error) => {
        console.error('Meteor: Worker process error:', error);
        if (!child.connected) {
            throw new MeteorViteError('Lost connection to Vite worker process');
        }
    });
    
    child.on('disconnect', () => {
        if (process.env.ENABLE_DEBUG_LOGS) {
            console.warn('Meteor: Worker process disconnected');
        }
    })
    
    return {
        call({ params, method }: Omit<WorkerMethod, 'id'>) {
            const message = {
                id: Random.id(),
                method,
                params,
            } as WorkerMethod;
            
            if (!options?.ipc?.active && !child.connected) {
                throw new MeteorViteError(`Oops worker process is not connected! Tried to send message to worker: ${method}`);
            }
            
            if (options?.ipc?.active) {
                options.ipc.call(message);
            }
            
            if (child.connected) {
                child.send(message);
            }
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

export const cwd = process.env.METEOR_VITE_CWD ?? guessCwd();
export const workerPath = Path.join(cwd, 'node_modules/meteor-vite/dist/bin/worker.mjs');
export function getProjectPackageJson<
    TFile extends 'package.json' | 'package-lock.json' = 'package.json'
>(file: TFile = 'package.json' as TFile): {
    'package.json': ProjectJson;
    'package-lock.json': {
        name: string;
        // lockfile v3
        packages?: Partial<Record<string, { version: string }>>
        
        // lockfile v1
        dependencies?: Partial<Record<string, { version: string }>>;
    }
}[TFile] {
    const path = Path.join(cwd, file);
    
    if (!FS.existsSync(path)) {
        throw new MeteorViteError([
            `Unable to locate ${pc.yellow(file)} for your project in ${pc.yellow(path)}`,
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

function prepareWorkerEnv({ ipcOverDdp = false }) {
    const workerEnvPrefix = 'METEOR_VITE_WORKER_';
    const env: Record<string, string | undefined> = {
        FORCE_COLOR: '3',
        ENABLE_DEBUG_LOGS: process.env.ENABLE_DEBUG_LOGS,
        METEOR_LOCAL_DIR: process.env.METEOR_LOCAL_DIR,
        STARTED_AT: Date.now().toString(),
        NODE_ENV: process.env.NODE_ENV,
    }
    if (ipcOverDdp) {
        const METEOR_RUNTIME = getMeteorRuntimeConfig()
        if (!METEOR_RUNTIME.fallback) {
            Object.assign(env, {
                DDP_IPC: true,
                METEOR_RUNTIME: JSON.stringify(METEOR_RUNTIME),
            })
        }
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
