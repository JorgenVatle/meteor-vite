import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';

import type { ProjectJson, ResolvedViteConfig } from '@/plugin';
import { version } from '@/utilities/common';
import { Colorize, createSimpleLogger, formatLogBlock, Logger } from '@/utilities/server';
import FS from 'fs';
import { Meteor } from 'meteor/meteor';
import Path from 'path';
import pc from 'picocolors';
import { version as viteVersion } from 'vite';

const startTime = performance.now();
// The global Meteor instance may not initially be defined within the plugin context during builds.
let { isDevelopment, release } = Meteor || {
    release: 'METEOR@unknown'
};

if (!Meteor.release) {
    try {
        release = FS.readFileSync(Path.join(CurrentConfig.projectRoot, '.meteor', 'release'), 'utf8').trim();
    } catch (error: unknown) {
        Logger.error(new MeteorViteError('Failed to read Meteor release file', { cause: error }));
    }
}

export default new class MeteorViteRuntime {
    public readonly logger = isDevelopment
                             ? createSimpleLogger(pc.cyan('[DEV]'))
                             : createSimpleLogger(pc.yellow(`[${process.env.NODE_ENV?.toUpperCase() || 'PROD'}]`));
    
    public printWelcomeMessage() {
        this.logger.success([
            `Vite ${pc.cyan(`v${viteVersion}`)}`,
            pc.dim(`(MeteorVite ${pc.cyan(`v${version}`)} - ${pc.cyan(release)})`)
        ].map((line) => pc.green(line)).join(' '));
    }
    
    public printUrls(config: Pick<ResolvedViteConfig, 'base'>) {
        const printUrl = (key: string, value: string) => [
            pc.white(`> ${key}:`.padEnd(11, ' ')),
            pc.cyan(value.replace(/(\d+)/, pc.bold(pc.cyanBright('$1')))),
        ].join('')
        
        this.logger.success(`Successfully bound to Meteor's WebApp middleware`, [
            '\n',
            printUrl('Meteor', Meteor.absoluteUrl()),
            printUrl('Vite', Meteor.absoluteUrl(config.base)),
            '',
            pc.cyan(`ready in ${Math.round(performance.now() - startTime).toLocaleString()}ms.`),
            '',
        ].join('\n    '));
    }
    
    public emitWarningMessages(packageJson: ProjectJson) {
        const { projectRoot} = CurrentConfig;
        if (FS.existsSync(Path.join(projectRoot, '.meteorignore'))) {
            Logger.warnOnce({ id: 'meteorignore' }, formatLogBlock(
                    `Detected ${Colorize.fileType('.meteorignore')} file.`,
                    [
                        `Make sure that the paths within won't match any files within`,
                        `${Colorize.filepath('./_vite-bundle')} as this could lead to certain assets not being`,
                        `available in production.`,
                        '\n\n',
                        `Anything outside of this directory you're free to ignore, you can even ignore source`,
                        `files as long as they are imported by your Vite entry module.`,
                    ],
                ),
            );
            
        }
        
        const nonEsmConfigFile = FS.existsSync(Path.join(projectRoot, 'vite.config.ts')) || FS.existsSync(Path.join(projectRoot, 'vite.config.js'));
        
        if (packageJson.type !== 'module' && nonEsmConfigFile) {
            const mts = Colorize.fileType('.mts');
            const mjs = Colorize.fileType('.mjs');
            Logger.warnOnce({ id: '.viteignore' }, formatLogBlock(
                `Vite config without ${mts} or ${mjs} extension detected.`,
                [
                    'This will likely prevent Meteor from starting when trying to resolve your config.',
                    `Renaming ${Colorize.fileType('vite.config.ts')} to ${Colorize.fileType('vite.config.mts')} should`,
                    `resolve the issue this in most cases.`,
                    '\n\n',
                    `Setting ${Colorize.jsonValue('"type": "module"')} in your ${Colorize.fileType('package.json')}`,
                    `should fix this, but Meteor lacks good support for this at the time of writing.`,
                    '\n\n ',
                    'The best workaround for using package.json "module" types is to symlink your',
                    `.meteor/local directory outside of your project root\n`,
                    `(e.g. ${Colorize.command('ln -s /tmp/.meteor-local/my-app .meteor/local')})`
                ]
            ))
        }
    }
}