import type { OutputOptions } from 'rollup';
import type { ResolvedConfig } from 'vite';
import type { DeepPartial, MakeOptional, MakeRequired } from './utilities/GenericTypes';

export interface PluginSettings<
    TChunkFileNames extends OutputOptions['chunkFileNames'] = undefined
> {
    /**
     * Vite client entry into Meteor.
     * Not to be confused with your Meteor mainModule.
     *
     * {@link https://github.com/JorgenVatle/meteor-vite#readme}
     */
    clientEntry: string;
    
    /**
     * Enter your Meteor server's entrypoint here to prebuild your Meteor server modules using Vite.
     * This will not compile your Atmosphere packages, but will build all your app's server modules into
     * a single file, greatly aiding Meteor in server reload performance during development.
     *
     * Not only does this come with improved performance, but also the flexibility of Vite's build system.
     * The Meteor server is built using Vite SSR mode. To configure just the server builds see
     * {@link https://vite.dev/config/#conditional-config Conditional Configuration docs}
     *
     * @experimental There's still some work left to be done before this is stable without additional configuration.
     */
    serverEntry?: string;
    
    /**
     * Failsafe opt-in to prevent experimental features and configuration from taking effect.
     */
    enableExperimentalFeatures?: boolean;
    
    /**
     * When building for production, Vite will normally serve static assets from the root of the current domain.
     * If you have a CDN or use different subdomains for your app, it can be a good idea to set a base URL for
     * your assets so that your assets are fetched from one consistent URL. This helps with caching and should
     * reduce load on both your clients and server.
     */
    assetsBaseUrl?: string;
    
    /**
     * Root directory to serve Vite assets from in production.
     * Defaults to /vite-assets.
     */
    assetsDir?: string;
    
    /**
     * Skips bundling the provided npm packages if they are already provided by Meteor.
     * This assumes you have a Meteor package that depends on the provided npm packages.
     */
    externalizeNpmPackages?: string[];
    
    /**
     * Override the destination directory for the intermediary Vite bundle - before the bundle is passed through
     * its final stage through the Meteor bundler.
     */
    tempDir?: string;
    
    /**
     * Settings for controlling how stubs created by Meteor-Vite are validated.
     * These settings only apply in a development environment. Once the app is bundled for production, runtime
     * stub validation is disabled.
     */
    stubValidation: {
        /**
         * list of packages to ignore export validation for.
         * @example
         * { ignorePackages: ['ostrio:cookies', 'test:ts-modules', ...] }
         */
        ignorePackages?: string[];
        
        /**
         * Suppress warning messages when we resolve a module that has conflicting export keys.
         * This is generally only an issue for React where as we ignore conditional exports when creating an ESM stub.
         * These are only ESM export stubs that point to your Meteor bundle, so it's generally safe to ignore.
         */
        ignoreDuplicateExportsInPackages?: string[];
        
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
    };
    
    /**
     * Internal configuration injected by the vite:bundler Meteor package. Specifies some important source paths
     * needed to assist Vite in building your Meteor project.
     *
     * If you know what you're doing, you could use this alongside the Internal.MeteorStubs plugin to build your project
     * using Vite independently of Meteor. Or to host the Vite dev server yourself instead of letting the vite:bundler
     * plugin do the work for you.
     */
    meteorStubs: {
        /**
         * Full content of the user's Meteor project package.json.
         * Like the one found in {@link /examples/vue/package.json}
         */
        packageJson?: ProjectJson;
        
        /**
         * Alternatively, a path to a package.json file can be supplied.
         */
        packageJsonPath?: string;
        
        /**
         * Enabling debug mode will write all input and output files to a `.meteor-vite` directory in the Meteor
         * project's root. Handy for quickly assessing how things are being formatted, or for use in writing up new
         * test cases for meteor-vite.
         */
        debug?: boolean;
        
        /**
         * Meteor project details. This resolved at runtime by our build plugin and injected into your Vite config.
         */
        meteor?: {
            /**
             * Path to Meteor's internal package cache.
             * This can change independently of the isopack path depending on whether we're building for production or
             * serving up the dev server.
             *
             * @example {@link /examples/vue/.meteor/local/build/programs/web.browser/packages}
             */
            packagePath: string;
            
            /**
             * Path to Meteor's local Isopacks store. Used to determine where a package's mainModule is located and
             * whether the package has lazy-loaded modules. During production builds this would be pulled from a
             * temporary Meteor build, so that we have solid metadata to use when creating Meteor package stubs.
             *
             * @example {@link /examples/vue/.meteor/local/isopacks/}
             */
            isopackPath: string;
            
            /**
             * Path to the current user's Meteor package cache. (e.g. /home/john/.meteor/packages)
             * This is used to build up a fallback path for isopack manifests.
             *
             * Some packages, like `react-meteor-data` do not emit a isopack metadata file within the current project's
             * .meteor/local directory. So we have to resort to pulling in Isopack metadata from the `meteor-tool`
             * cache.
             *
             * @example `react-meteor-data` path
             * /home/john/.meteor/packages/react-meteor-data/2.7.2/web.browser.json
             */
            globalMeteorPackagesDir?: string;
        };
    };
    
    /**
     * Customize the chunk file name format for Rollup builds.
     * Filename uniqueness is important as duplicate filenames for server and client modules may prevent your other
     * build plugins from handling server code, leading to unstable server builds.
     *
     * Important: Filenames are not scoped by directory. So the chunk filenames need to be unique across the entirety
     * of your project.
     *
     * Only change this if you are sure you know what you're doing.
     */
    chunkFileNames?: TChunkFileNames
}

export type StubValidationSettings = PluginSettings['stubValidation'];

/**
 * The user's Meteor project package.json content.
 * todo: expand types
 */
export type ProjectJson = {
    name: string;
    dependencies: {
        'meteor-vite'?: string;
    }
    devDependencies: {
        'meteor-vite'?: string;
    }
    meteor: {
        /**
         * Meteor's client and server mainModule entrypoints.
         * It's important that both of these are configured in your project's package.json and at the very least the
         * client mainModule.
         */
        mainModule: {
            client: string;
            server?: string;
        },
        
        /**
         * @deprecated Use meteor.vite.configFile instead.
         * See {@link https://github.com/JorgenVatle/meteor-vite?tab=readme-ov-file#configuration configuration} for
         * example.
         */
        viteConfig?: string;
        
        /**
         * Additional Meteor-Vite configuration that cannot be inferred through the plugin settings.
         * These settings are parsed by the `vite-bundler` Meteor build plugin.
         */
        vite?: {
            /**
             * Specifies an alternative path to the project's Vite config
             */
            configFile?: string;
            
            /**
             * Remove or replace Meteor packages when preparing the intermediary production build.
             * Does not affect your final production bundle. It's only used as a temporary build step.
             */
            replacePackages?: {
                startsWith: string; // Match any Meteor package name that starts with the provided string.
                replaceWith: string; // Replace matching packages with the provided string.
            }[];
            
            /**
             * Override the directory path used for preparing the Vite production bundle.
             * Might be useful if the automatically generated file path is inaccessible in your operating system
             */
            tempBuildDir?: string;
        }
    }
}

export type PluginOptions = MakeOptional<PluginSettings, 'stubValidation' | 'meteorStubs' | 'tempDir'>;
export type PartialPluginOptions = DeepPartial<PluginSettings>;
export type MeteorStubsSettings = Required<MakeRequired<PluginSettings['meteorStubs'], 'meteor'>>;
export type ResolvedPluginSettings = MakeRequired<
    Omit<PluginSettings, 'meteorStubs'> & { meteorStubs: MeteorStubsSettings },
    'tempDir'
>;

/**
 * A resolved Vite config, after our workers has merged it with default settings and overrides from the Meteor instance.
 */
export declare interface ResolvedMeteorViteConfig extends ResolvedConfig {
    meteor?: ResolvedPluginSettings;
}

