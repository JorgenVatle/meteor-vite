import FS from 'fs/promises';
import Path from 'path';
import { build, mergeConfig, resolveConfig } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import Logger from '../utilities/Logger';
import { type ProjectJson, ResolvedMeteorViteConfig } from '../VitePluginSettings';

const BUNDLE_OUT = {
    dir: Path.join('_vite', 'server'),
    filename: 'meteor.server',
}

export async function MeteorServerBuilder({ packageJson, watch = true }: { packageJson: ProjectJson, watch?: boolean }) {
    const viteConfig: ResolvedMeteorViteConfig = await resolveConfig({
        configFile: packageJson?.meteor?.vite?.configFile
            // Fallback for deprecated config format
            ?? packageJson?.meteor?.viteConfig,
    }, 'serve');
    
    if (!viteConfig.meteor?.serverEntry) {
        return;
    }
    
    Logger.warn(
        'Meteor Server bundling with Vite is enabled. This is an experimental feature that will attempt to bundle' +
        ' your Meteor server using Vite.',
    )
    
    if (!viteConfig.meteor?.enableExperimentalFeatures) {
        Logger.warn(
            'To enable server bundling, you need to set "enableExperimentalFeatures" to true in your Vite' +
            ' config. To disable these warnings, just remove the "serverEntry" field in your Vite config.'
        )
        return;
    }
    
    if (!packageJson.meteor.mainModule.server) {
        throw new MeteorViteError('You need to specify a Meteor server mainModule in your package.json file!')
    }
    
    await prepareServerEntry({
        meteorMainModule: Path.resolve(packageJson.meteor.mainModule.server),
        viteServerBundle: Path.resolve(
            Path.join(BUNDLE_OUT.dir, BUNDLE_OUT.filename)
        ),
    })
    
    build({
        configFile: viteConfig.configFile,
        build: {
            watch: watch ? {} : null,
            ssr: viteConfig.meteor.serverEntry,
            outDir: BUNDLE_OUT.dir,
            minify: false,
            sourcemap: true,
            emptyOutDir: false,
        }
    }).catch((error) => {
        Logger.error('Encountered error while preparing server build!', error);
    }).then(() => {
        Logger.info('Server build completed!');
    });
}

async function prepareServerEntry(paths: {
    meteorMainModule: string;
    viteServerBundle: string;
}) {
    const mainModuleContent = await FS.readFile(paths.meteorMainModule, 'utf8');
    const relativeViteModulePath = Path.relative(
        Path.dirname(paths.meteorMainModule),
        paths.viteServerBundle,
    );
    
    // Add .gitignore to build output
    {
        const gitignorePath = Path.join(Path.dirname(paths.viteServerBundle), '.gitignore');
        await FS.mkdir(Path.dirname(paths.viteServerBundle), { recursive: true });
        await FS.writeFile(gitignorePath, '*');
    }
    
    // Add import for Vite bundle to server mainModule
    {
        const importString = `import(${JSON.stringify('./' + relativeViteModulePath)}).catch((e) => console.warn('Failed to load Vite server bundle. If this is the first time starting the server, you can safely ignore this error.', e))`;
        
        if (mainModuleContent.includes(importString)) {
            return;
        }
        
        Logger.info(`Added explicit import for Meteor-Vite server bundle to ${relativeViteModulePath}`);
        const newMainModuleContent = `${importString}\n${mainModuleContent}`;
        await FS.writeFile(paths.meteorMainModule, newMainModuleContent);
    }
    
}
