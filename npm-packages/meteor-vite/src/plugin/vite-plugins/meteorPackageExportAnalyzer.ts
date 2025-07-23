import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';
import type { UserViteConfig } from '@/plugin';
import { BuildLogger, Colorize, ViteBundleLogger as Logger } from '@/utilities/server';
import { execa } from 'execa';
import FS from 'fs';
import Path from 'path';
import type { Plugin } from 'vite';

export function meteorPackageExportAnalyzer(): Plugin {
    return {
        name: 'meteor-vite:package-analyzer',
        apply: 'build',
        
        async config({ meteor }: UserViteConfig) {
            const packageJson = meteor?.meteorStubs.packageJson;
            if (!meteor) {
                throw new Error('Vite is missing Meteor configuration!')
            }
            if (!packageJson) {
                throw new Error(`Vite is missing Meteor's package.json configuration!`);
            }
            
            await preparePackagesForExportAnalyzer({
                mainModule: packageJson.meteor.mainModule,
                replacePackages: packageJson.meteor.vite?.replacePackages || [],
            });
            
            meteor.meteorStubs.meteor.buildProgramsPath = CurrentConfig.packageAnalyzer.buildProgramsDir;
            meteor.meteorStubs.meteor.isopackPath = CurrentConfig.packageAnalyzer.isopackPath;
        }
    }
}

/**
 * Build a temporary Meteor project to generate package source files that
 * can be analyzed for package export stubbing.
 */
async function preparePackagesForExportAnalyzer({ mainModule, replacePackages = [] }: {
    mainModule: { client: string },
    replacePackages?: PackageReplacement[];
}) {
    const inDir = CurrentConfig.packageAnalyzer.inDir;
    const outDir = CurrentConfig.packageAnalyzer.outDir;
    
    BuildLogger.info('Building packages to make them available to export analyzer...')
    BuildLogger.debug(`Destination dir: ${outDir}`);
    
    const startTime = Date.now();
    const filesToCopy = [
        Path.join('.meteor', '.finished-upgraders'),
        Path.join('.meteor', '.id'),
        Path.join('.meteor', 'packages'),
        Path.join('.meteor', 'platforms'),
        Path.join('.meteor', 'release'),
        Path.join('.meteor', 'versions'),
        Path.join('.meteor', 'local', 'resolver-result-cache.json'),
        'package.json',
        mainModule.client,
    ]
    const directoriesToCopy = [
        'node_modules',
        'packages',
    ];
    const replaceMeteorPackages: PackageReplacement[] = [
        { startsWith: 'standard-minifier', replaceWith: '' },
        { startsWith: 'refapp:meteor-typescript', replaceWith: 'typescript' },
        ...replacePackages,
    ]
    
    // Copy files from `.meteor`
    for (const file of filesToCopy) {
        const from = Path.join(CurrentConfig.projectRoot, file)
        const to = Path.join(inDir, file)
        FS.mkdirSync(Path.dirname(to), { recursive: true });
        try {
            FS.copyFileSync(from, to)
        } catch (error) {
            if (!(error instanceof Error) || !('code' in error)) {
                throw error;
            }
            if (error.code !== 'ENOENT') {
                throw error;
            }
            if (file.includes('.finished-upgraders')) {
                Logger.warn(`Could not copy ${Colorize.filepath(file)} from source project. Likely because you have a new Meteor project. Generally safe to ignore, only consequence may be that package export analysis may take a little longer if updates are necessary.`);
                continue;
            }
            throw error;
        }
    }
    
    // Symlink to source project's `packages` and `node_modules` folders
    for (const dir of directoriesToCopy) {
        const from = Path.join(CurrentConfig.projectRoot, dir);
        const to = Path.join(inDir, dir);
        
        if (!FS.existsSync(from)) continue;
        if (FS.existsSync(to)) continue;
        
        FS.symlinkSync(from, to);
    }
    
    // Remove/replace conflicting Atmosphere packages
    {
        const file = Path.join(inDir, '.meteor', 'packages')
        let content = FS.readFileSync(file, 'utf8')
        for (const pack of replaceMeteorPackages) {
            const lines = content.split('\n')
            content = lines.map(line => {
                if (!line.startsWith(pack.startsWith)) {
                    return line;
                }
                Logger.debug(`Removed from intermediary Meteor packages:\n L ${Colorize.textSnippet(line)}`);
                return pack.replaceWith || '';
            }).join('\n')
        }
        FS.writeFileSync(file, content)
    }
    // Remove server entry
    {
        const file = Path.join(inDir, 'package.json')
        const data = JSON.parse(FS.readFileSync(file, 'utf8'))
        data.meteor = {
            mainModule: {
                client: data.meteor.mainModule.client,
            },
        }
        FS.writeFileSync(file, JSON.stringify(data, null, 2))
    }
    // Only keep meteor and npm package imports to enable lazy packages
    {
        const file = Path.join(inDir, mainModule.client)
        const lines = FS.readFileSync(file, 'utf8').split('\n');
        const imports = lines.filter(line => {
            if (!line.startsWith('import')) return false;
            if (line.includes('meteor/')) {
                BuildLogger.debug('Keeping meteor import line:', line);
                return true;
            }
            if (!line.match(/["'`]\./)) {
                BuildLogger.debug('Keeping non-meteor import line', line);
                return true;
            }
            BuildLogger.debug('Stripped import line from intermediary build:', line);
            return false;
        })
        FS.writeFileSync(file, imports.join('\n'))
    }
    
    const METEOR_PACKAGE_DIRS = [
        Path.join(CurrentConfig.projectRoot, 'packages'),
    ]
    
    if (process.env.METEOR_PACKAGE_DIRS) {
        METEOR_PACKAGE_DIRS.push(Path.resolve(process.env.METEOR_PACKAGE_DIRS));
    }
    
    await execa('meteor', [
        'build',
        outDir,
        '--directory',
        // Ensure the temporary build doesn't abort for projects with mobile builds
        // Since this is only a temporary build, it shouldn't impact the final production build for the developer.
        '--server=http://localhost:3000',
    ], {
        cwd: inDir,
        // stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            FORCE_COLOR: '3',
            VITE_METEOR_DISABLED: 'true',
            METEOR_PACKAGE_DIRS: METEOR_PACKAGE_DIRS.join(':'),
        },
    })
    
    BuildLogger.success(`Packages built in ${(Date.now() - startTime).toLocaleString()}ms`);
}

type PackageReplacement = {
    startsWith: string;
    replaceWith: string;
}