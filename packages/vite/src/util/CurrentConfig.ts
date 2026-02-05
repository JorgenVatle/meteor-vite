import FS from 'node:fs';
import Path from 'path';
import buildPluginPackageJson from '../../package.json';

/**
 * Attempt to guess the project root based on the current working directory.
 * The Meteor dev server may run with .meteor/local as the working directory.
 *
 * This will pick out the closest parent directory to .meteor, which generally
 * will be the path to their Meteor project's app root directory.
 * (where; node_modules, package-lock.json, imports, etc. Lives).
 */
function guessCwd(): string {
    const cwd = process.env.PWD ?? process.cwd();
    
    const [projectRoot] = cwd.split(/[/\\]\.meteor[/\\]/)
    
    return projectRoot;
}

const projectRootOriginal = guessCwd();
const projectRoot = FS.realpathSync(projectRootOriginal);
const configFile = Path.resolve(Path.join(projectRoot, 'vite.config.ts'));
const tempDir = Path.join(projectRoot, '_vite-bundle');
const bundleFileExtension = '_vite';
const productionPreview = process.argv.includes('--production');

process.env.METEOR_PROJECT_ROOT = projectRoot;

export const CurrentConfig = {
    buildPluginVersion: buildPluginPackageJson.version,
    projectRoot,
    bootstrapEvalFilename: Path.join(projectRoot, '__meteor-vite-runtime-bootstrap__.ts'),
    configFile,
    mode: process.env.NODE_ENV || 'development',
    bundleFileExtension,
    tempDir,
    productionPreview,
    
    // Vite bundle will be placed here when building for production.
    // It's important to empty this directory when starting Meteor
    // in development mode.
    outDir: Path.join(tempDir, 'dist'),
    
    meteorPackagesFile: Path.join(projectRoot, '.meteor', 'packages'),
    
    readmeLink: (section: 'meteor-build-plugins') => `https://github.com/JorgenVatle/meteor-vite#${section}`
} as const;

globalThis.MeteorViteRuntimeConfig = CurrentConfig;