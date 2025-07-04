import FS from 'fs';
import { Meteor } from 'meteor/meteor';
import Path from 'path';
import pc from 'picocolors';
import { version as viteVersion } from 'vite';
import { Colorize } from '../../../utilities';
import { version } from '../../../utilities/Constants';
import Logger, { createSimpleLogger } from '../../../utilities/Logger';
import type { ProjectJson, ResolvedMeteorViteConfig } from '../../plugin/Settings';
import { CurrentConfig } from './Config';

const startTime = performance.now();
// The global Meteor instance may not initially be defined within the plugin context during builds.
const { isDevelopment, release } = Meteor || {};

export default new class Instance {
    public readonly logger = isDevelopment
                             ? createSimpleLogger(pc.cyan('[DEV]'))
                             : createSimpleLogger(pc.yellow(`[${process.env.NODE_ENV?.toUpperCase() || 'PROD'}]`));
    
    public printWelcomeMessage() {
        this.logger.success([
            `Vite ${pc.cyan(`v${viteVersion}`)}`,
            pc.dim(`(MeteorVite ${pc.cyan(`v${version}`)} - ${pc.cyan(release)})`)
        ].map((line) => pc.green(line)).join(' '));
    }
    
    public printUrls(config: Pick<ResolvedMeteorViteConfig, 'base'>) {
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
            Logger.warnOnce({ id: '.meteorignore' }, [
                `Detected ${Colorize.fileType('.meteorignore')} file.`,
                `Make sure that the paths within won't match any files within ${Colorize.filepath('./_vite-bundle')} as this`,
                `could lead to certain assets not being available in production.`,
                '',
                `Anything outside of this directory you're free to ignore, you can even ignore source`,
                `files as long as they are imported by your Vite entry module.\n\n`,
            ].join('\n   '));
        }
        
        const nonEsmConfigFile = FS.existsSync(Path.join(projectRoot, 'vite.config.ts')) || FS.existsSync(Path.join(projectRoot, 'vite.config.js'));
        
        if (packageJson.type !== 'module' && nonEsmConfigFile) {
            Logger.warnOnce({ id: '.viteignore' }, [
                `Vite config without .mjs or .mts extension detected.`,
                'This will likely prevent Meteor from starting when trying to resolve your config.',
                'Renaming vite.config.ts to vite.config.mts should resolve the issue this in most cases',
                '',
                'Setting "type": "module" in your package.json should fix this, but Meteor lacks good support for this',
                'at the time of writing. The best workaround for using package.json "module" types is to symlink your',
                '.meteor/local directory outside of your project root (e.g. ln -s /tmp/.meteor-local/my-app .meteor/local)\n\n',
            ].join('\n   '))
        }
    }
}