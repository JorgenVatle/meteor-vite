/**
 * The user's Meteor project package.json content.
 * todo: expand types
 */
export type ProjectJson = {
    name: string;
    type?: 'module' | 'commonjs',
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