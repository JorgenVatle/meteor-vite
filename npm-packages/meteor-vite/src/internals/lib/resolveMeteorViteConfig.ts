// noinspection ExceptionCaughtLocallyJS

import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { resolveMainModules } from '@/internals/lib/EntryModule/helpers/resolve';
import { parsePackageJson } from '@/internals/lib/parsePackageJson';

import type { ResolvedViteConfig } from '@/plugin';
import { documentationLink } from '@/utilities/common';
import { type InlineConfig, resolveConfig } from 'vite';
import Instance from './MeteorViteRuntime';

export const CurrentConfig = globalThis.MeteorViteRuntimeConfig;

export async function resolveMeteorViteConfig(
    inlineConfig: Omit<InlineConfig, 'future'>,
    command: 'build' | 'serve',
) {
    try {
        Instance.printWelcomeMessage();
        Instance.logger.info('Resolving Vite config...');
        
        const { projectRoot, outDir } = CurrentConfig;
        const packageJson = parsePackageJson();
        process.chdir(projectRoot);
        
        /**
         * Check for and warn users of potential project misconfigurations
         */
        Instance.emitWarningMessages(packageJson)
        
        /**
         * Only available within the context of the compiler plugin.
         * At runtime, Meteor-Tool's initial arguments aren't made available
         */
        const isSimulatedProduction = process.argv.includes('--production');
        const needsReactPreamble = Object.keys(packageJson?.devDependencies || {}).includes('@vitejs/plugin-react') || Object.keys(packageJson.dependencies || {}).includes('@vitejs/plugin-react');
        let viteServerMainModule: undefined | string = undefined;
        
        const userConfig: ResolvedViteConfig = await resolveConfig(Object.assign({
            configFile: packageJson.meteor.vite?.configFile,
            meteor: {
                meteorStubs: {
                    packageJson,
                }
            }
        }, inlineConfig), command);
        
        if (!userConfig.meteor?.clientEntry) {
            throw new MeteorViteError('Cannot build application. You need to specify a clientEntry in your Vite config!', {
                subtitle: `Visit ${documentationLink('vite-config')} for more details`
            });
        }
        
        if (userConfig.meteor.serverEntry) {
            if (userConfig.meteor.enableExperimentalFeatures) {
                viteServerMainModule = userConfig.meteor.serverEntry;
            } else {
                Instance.logger.warn(
                    'To enable server bundling, you need to set "enableExperimentalFeatures" to true in your Vite' +
                    ' config. To disable these warnings, just remove the "serverEntry" field in your Vite config.'
                );
            }
        }
        
        if (!userConfig.meteor._configSource) {
            throw new MeteorViteError('Use of top-level `meteor` config property in Vite config is deprecated. Make sure you configure Meteor-Vite using the Vite plugin instead of the top-level `meteor` config property!', {
                subtitle: `See the readme for an example: ${documentationLink('vite-config')}`
            })
        }
        
        const mainModule = resolveMainModules({ packageJson, userConfig, command });
        
        const config = {
            ...inlineConfig,
            meteor: userConfig.meteor,
            base: userConfig.base,
        } satisfies InlineConfig & Pick<ResolvedViteConfig, 'meteor'>;
        
        return {
            config,
            packageJson,
            outDir,
            assetsDir: userConfig.meteor.assetsDir,
            needsReactPreamble,
            viteServerMainModule,
            mainModule,
            isSimulatedProduction,
        }
    } catch (error) {
        if (error instanceof MeteorViteError) {
            Instance.logger.error(error);
            throw new Error('Could not resolve Meteor-Vite config.', { cause: error });
        }
        throw error;
    }
}