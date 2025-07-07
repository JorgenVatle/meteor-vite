import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import { createSimpleLogger } from '@/utilities/server';
import FS from 'node:fs';
import Path from 'node:path';
import pc from 'picocolors';
import { parse, satisfies } from 'semver';
import { version as npmPackageVersion } from '../../../package.json';

const logger = createSimpleLogger('Setup');

export function setupProject() {
    validateVersions();
    cleanupPreviousBuilds();
    prepareServerEntry();
    // Create entry modules for the server.
}

function validateVersions() {
    if (!CurrentConfig.buildPluginVersion) {
        logger.warn(`Could not retrieve version from jorgenvatle:vite. This could mean it's out of date. Try running ${pc.yellow(
            'meteor update jorgenvatle:vite')} to update it`);
        return;
    }
    
    logger.info(`jorgenvatle:vite v${CurrentConfig.buildPluginVersion}`);
    logger.info(`meteor-vite v${npmPackageVersion}`);
    
    const expectedVersion = {
        meteorPackage: parse('1.6.0')!,
        npmPackage: parse('3.9.0')!,
    };
    
    if (!satisfies(npmPackageVersion, `^${expectedVersion.npmPackage.raw}`)) {
        const { minor, major } = expectedVersion.npmPackage;
        const command = pc.yellow(`npm i meteor-vite@${minor}.${major}`);
        logger.warn(`meteor-vite is out of date! Try updating it: ${command}`);
    }
    
    if (!satisfies(CurrentConfig.buildPluginVersion, `^${expectedVersion.meteorPackage.raw}`)) {
        const command = pc.yellow(`meteor update jorgenvatle:vite`);
        logger.warn(`jorgenvatle:vite is out of date! Try updating it: ${command}`);
    }
}

/**
 * Clean up temporary files created by previous production builds.
 * Remaining build files can interfere with the dev server
 */
function cleanupPreviousBuilds() {
    if (CurrentConfig.productionPreview) {
        return;
    }
    FS.rmSync(CurrentConfig.outDir, { recursive: true, force: true });
    logger.info(`Cleaned up old build output in ${pc.green(CurrentConfig.outDir)}`);
}

/**
 * Create an empty entry module that can imported by Meteor's mainModule configured in package.json.
 */
function prepareServerEntry() {
    FS.mkdirSync(Path.dirname(CurrentConfig.serverEntryModule), { recursive: true });
    FS.writeFileSync(
        Path.join(
            CurrentConfig.tempDir,
            '.gitignore',
        ),
        '*',
    );
    FS.writeFileSync(
        CurrentConfig.serverEntryModule,
        '// Dynamic entrypoint for the Meteor server. Imports are added here during builds',
    );
}