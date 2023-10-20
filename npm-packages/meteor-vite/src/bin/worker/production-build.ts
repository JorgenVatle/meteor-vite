import { RollupOutput, RollupWatcher } from 'rollup';
import { build, InlineConfig, resolveConfig } from 'vite';
import { MeteorViteConfig } from '../../vite/MeteorViteConfig';
import { MeteorStubs } from '../../vite';
import MeteorVitePackage from '../../../package.json';
import { PluginSettings, ProjectJson } from '../../vite/plugin/MeteorStubs';
import CreateIPCInterface, { IPCReply } from './IPC/interface';

export default CreateIPCInterface({
    async buildForProduction(
        reply: Replies,
        buildConfig: BuildOptions
    ) {
        try {
            const { viteConfig, inlineBuildConfig } = await prepareConfig(buildConfig);
            const results = await build(inlineBuildConfig);
            const result = Array.isArray(results) ? results[0] : results;
            validateOutput(result);

            // Result payload
            reply({
                kind: 'buildResult',
                data: {
                    payload: {
                        success: true,
                        meteorViteConfig: viteConfig.meteor,
                        output: result.output.map(o => ({
                            name: o.name,
                            type: o.type,
                            fileName: o.fileName,
                        })),
                    },
                }
            })
        } catch (error) {
            reply({
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

async function prepareConfig(buildConfig: BuildOptions): Promise<ParsedConfig> {
    const { viteOutDir, meteor, packageJson } = buildConfig;
    const configFile = buildConfig.packageJson?.meteor?.viteConfig;

    Object.entries(buildConfig).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`Vite: Worker missing required build argument "${key}"!`)
        }
    })

    const viteConfig: MeteorViteConfig = await resolveConfig({ configFile }, 'build');

    if (!viteConfig.meteor?.clientEntry) {
        throw new Error(`You need to specify an entrypoint in your Vite config! See: ${MeteorVitePackage.homepage}`);
    }

    return {
        viteConfig,
        inlineBuildConfig: {
            configFile,
            build: {
                lib: {
                    entry: viteConfig?.meteor?.clientEntry,
                    formats: ['es'],
                },
                rollupOptions: {
                    output: {
                        entryFileNames: 'meteor-entry.js',
                        chunkFileNames: '[name].js',
                    },
                },
                outDir: viteOutDir,
                minify: false,
            },
            plugins: [
                MeteorStubs({
                    meteor,
                    stubValidation: viteConfig.meteor.stubValidation,
                    packageJson,
                }),
            ],
        }
    }
}

function validateOutput(rollupResult?: RollupOutput | RollupWatcher): asserts rollupResult is RollupOutput {
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

interface BuildOptions {
    viteOutDir: string;
    meteor: PluginSettings['meteor'];
    packageJson: ProjectJson;
}

type Replies = IPCReply<{
    kind: 'buildResult',
    data: {
        payload: {
                     success: true;
                     meteorViteConfig: any,
                     output?: {name?: string, type: string, fileName: string}[]
                 } | {
                     success: false;
                 };
    }
}>

type ParsedConfig = {
    viteConfig: MeteorViteConfig;
    inlineBuildConfig: InlineConfig;
}


