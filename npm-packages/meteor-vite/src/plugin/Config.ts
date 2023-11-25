import Path from 'path';
import { Plugin, UserConfig } from 'vite';
import { MeteorViteError } from '../error/MeteorViteError';
import { MeteorStubsSettings } from './internal/MeteorStubs';
import PackageJSON from '../../package.json';

export default function configure(config: PluginSettings): Plugin {
    const clientEntry = config.clientEntry;
    
    if (!clientEntry) {
        throw new MeteorViteError(`You need to specify an entrypoint for Vite!`, {
            subtitle: `More info available here ${PackageJSON.homepage}`
        })
    }
    
    return {
        name: 'meteor-vite:config',
        config: () =>  ({
            meteor: config,
            build: meteorBuildConfig({ clientEntry })
        } as UserConfig),
    }
}

export interface PluginSettings {
    /**
     * Vite client entry into Meteor.
     * Not to be confused with your Meteor mainModule.
     *
     * {@link https://github.com/JorgenVatle/meteor-vite#readme}
     */
    clientEntry?: string;
    
    /**
     * Settings for controlling how stubs created by Meteor-Vite are validated.
     * These settings only apply in a development environment. Once the app is bundled for production, runtime
     * stub validation is disabled.
     */
    stubValidation?: StubValidationSettings;
    
    /**
     * Internal configuration injected by the vite:bundler Meteor package. Specifies some important source paths
     * needed to assist Vite in building your Meteor project.
     *
     * If you know what you're doing, you could use this alongside the Internal.MeteorStubs plugin to build your project
     * using Vite independently of Meteor. Or to host the Vite dev server yourself instead of letting the vite:bundler
     * plugin do the work for you.
     */
    meteorStubs?: MeteorStubsSettings;
}

export interface StubValidationSettings {
    /**
     * list of packages to ignore export validation for.
     * @example
     * { ignorePackages: ['ostrio:cookies', 'test:ts-modules', ...] }
     */
    ignorePackages?: string[];
    
    /**
     * Will only emit warnings in the console instead of throwing an exception that may prevent the client app
     * from loading.
     * @default true
     */
    warnOnly?: boolean;
    
    /**
     * Whether to completely disable stub validation feature for Meteor-Vite.
     *
     * Tip:
     * You can use a conditional Vite configuration to enable/disable this for your production build
     * {@link https://vitejs.dev/config/#conditional-config}
     *
     * @default false
     */
    disabled?: boolean;
}

export function meteorBuildConfig({
    clientEntry,
    outDir = Path.join('client', 'vite')
}: {
    clientEntry: string,
    outDir?: string,
}): UserConfig['build'] {
    return {
        lib: {
            entry: clientEntry,
            formats: ['es'],
        },
        rollupOptions: {
            output: {
                entryFileNames: 'meteor-entry.js',
                chunkFileNames: '[name].js',
            },
        },
        outDir,
        minify: false,
    }
}