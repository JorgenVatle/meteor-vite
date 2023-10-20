import { fork } from 'node:child_process'
import Path from 'node:path'
import FS from 'node:fs'
import { Meteor } from 'meteor/meteor'
import pc from 'picocolors'
import type { WorkerMethod, WorkerResponse } from '../../npm-packages/meteor-vite'
import type { WorkerResponseHooks } from '../../npm-packages/meteor-vite/src/bin/worker'
import type { MeteorIPCMessage } from '../../npm-packages/meteor-vite/src/meteor/MeteorEvents'
import type { ProjectJson } from '../../npm-packages/meteor-vite/src/vite/plugin/MeteorStubs'

export const cwd = process.env.METEOR_VITE_CWD ?? guessCwd()
export const meteorPackagePath = guessMeteorPackagePath()
export const workerPath = Path.join(cwd, 'node_modules/meteor-vite/dist/bin/worker/index.mjs')

// Use a worker to skip reify and Fibers
// Use a child process instead of worker to avoid WASM/archived threads error
export function createWorkerFork(hooks: Partial<WorkerResponseHooks>) {
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
        detached: false,
        env: {
            FORCE_COLOR: '3',
        },
    });
    
    const hookMethods = Object.keys(hooks) as (keyof typeof hooks)[];
    hookMethods.forEach((method) => {
        const hook = hooks[method];
        if (typeof hook !== 'function') return;
        (hooks[method] as typeof hook) = Meteor.bindEnvironment(hook);
    })
    
    child.on('message', (message: WorkerResponse & { data: any }) => {
        const hook = hooks[message.kind];
        
        if (typeof hook !== 'function') {
            return console.warn('Meteor: Unrecognized worker message!', { message });
        }
        
        return hook(message.data);
    });
    
    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(event => {
        process.once(event, () => {
            child.kill()
        })
    });
    
    return {
        call(method: Omit<WorkerMethod, 'replies'>) {
            child.send(method);
        },
        child,
    }
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
export const meteorPackagePath = guessMeteorPackagePath();
export const workerPath = Path.join(cwd, 'node_modules/meteor-vite/dist/bin/worker/index.mjs');
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
function guessMeteorPackagePath() {
    const [root, ...parts] = process.argv0.split(/[\/\\]/);
    let packagePath = root || '/';
    
    parts.forEach((part) => {
        if (packagePath.includes('/.meteor/packages/meteor-tool')) {
            return;
        }
        packagePath = Path.posix.join(packagePath, part);
    });
    
    return Path.join(packagePath, '../');
}
