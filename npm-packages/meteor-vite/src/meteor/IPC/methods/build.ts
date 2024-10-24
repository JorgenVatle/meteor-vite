import FS from 'fs';
import Path from 'path';
import { RollupOutput } from 'rollup';
import { build, InlineConfig, resolveConfig, BuildOptions as ViteBuildOptions } from 'vite';
import MeteorVitePackage from '../../../../package.json';
import {
    type ResolvedMeteorViteConfig,
    type ProjectJson,
    type MeteorStubsSettings,
} from '../../../VitePluginSettings';
import { meteorWorker } from '../../../plugin/Meteor';
import { MeteorServerBuilder } from '../../ServerBuilder';
import { defineIpcMethods } from '../interface';
import { IPC } from '../transports/Transport';

type BuildOutput = Awaited<ReturnType<typeof build>>;

export default defineIpcMethods({
    async'vite.build'(buildConfig: BuildOptions) {
        try {
            const { viteConfig, inlineBuildConfig, outDir } = await prepareConfig(buildConfig);
            const results = await build(inlineBuildConfig);
            if (viteConfig.meteor?.serverEntry) {
                await MeteorServerBuilder({ packageJson: buildConfig.packageJson, watch: false });
            }
            const result = Array.isArray(results) ? results[0] : results;
            validateOutput(result);
            
            const output = result.output.map((chunk) => {
                // Transform Vite manifest so that we can supply the Meteor production environment with useful
                // information about the build.
                if (chunk.fileName.endsWith('vite-manifest.json')) {
                    const path = Path.join(outDir, chunk.fileName);
                    const files = JSON.parse(FS.readFileSync(path, 'utf-8'));
                    FS.writeFileSync(path, JSON.stringify({
                        base: inlineBuildConfig.base,
                        assetsDir: inlineBuildConfig.build?.assetsDir,
                        files,
                    } satisfies TransformedViteManifest))
                }
                
                return {
                    name: chunk.name,
                    type: chunk.type,
                    fileName: chunk.fileName,
                }
            })

            // Result payload
            await IPC.reply({
                kind: 'buildResult',
                data: {
                    payload: {
                        outDir,
                        success: true,
                        meteorViteConfig: viteConfig.meteor,
                        output,
                    },
                }
            })
        } catch (error) {
            await IPC.reply({
                kind: 'buildResult',
                data: {
                    payload: {
                        success: false
                    },
                }
            })
            throw error;
        }
    }
})

async function prepareConfig(buildConfig: BuildOptions) {
    const { meteor, packageJson } = buildConfig;
    const configFile = buildConfig.packageJson?.meteor?.vite?.configFile
        // Fallback for deprecated config file format
        ?? buildConfig.packageJson?.meteor?.viteConfig;

    Object.entries(buildConfig).forEach(([key, value]) => {
        if (typeof value === 'undefined') {
            throw new Error(`Vite: Worker missing required build argument "${key}"!`)
        }
    })

    const viteConfig: ResolvedMeteorViteConfig = await resolveConfig({
        configFile,
        plugins: [
            meteorWorker({}) // Fills in defaults for missing fields.
        ]
    }, 'build');

    if (!viteConfig.meteor?.clientEntry) {
        throw new Error(`You need to specify an entrypoint in your Vite config! See: ${MeteorVitePackage.homepage}`);
    }

    const outDir = Path.join(viteConfig.meteor.tempDir, 'bundle');
    
    
    return {
        viteConfig,
        outDir,
        inlineBuildConfig: {
            base: viteConfig.meteor.assetsBaseUrl || '',
            configFile,
            build: {
                assetsDir: viteConfig.meteor.assetsDir || 'vite-assets',
                manifest: 'vite-manifest.json',
                minify: true,
                outDir,
                rollupOptions: {
                    input: viteConfig.meteor.clientEntry,
                },
            },
            plugins: [
                meteorWorker({
                    meteorStubs: {
                        meteor,
                        packageJson,
                    },
                }),
            ],
        }
    } satisfies ParsedConfig;
}

function validateOutput(rollupResult?: BuildOutput | RollupOutput): asserts rollupResult is RollupOutput {
    if (!rollupResult) {
        throw new Error('Received no result from Rollup!');
    }

    if ('output' in rollupResult) {
        return;
    }

    const message = 'Unexpected rollup result!';
    console.error(message, rollupResult);
    throw new Error(message);
}

export interface BuildOptions {
    meteor: MeteorStubsSettings['meteor'];
    packageJson: ProjectJson;
}

export type BuildResultChunk = {name?: string, type: string, fileName: string};

type ParsedConfig = {
    viteConfig: ResolvedMeteorViteConfig;
    inlineBuildConfig: InlineConfig;
    outDir: string;
}

export type TransformedViteManifest = {
    base: string;
    assetsDir: string;
    files: Record<string, ViteManifestFile>;
}

export type ViteManifestFile = {
    file: string;
    src: string;
    name?: string;
    isDynamicEntry?: boolean;
    isEntry?: boolean;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
}

