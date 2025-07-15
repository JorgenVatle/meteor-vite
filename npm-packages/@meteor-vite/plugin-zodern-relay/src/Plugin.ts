import { transformAsync } from '@babel/core';
import FS from 'fs';
import Path from 'path';
import { type Plugin } from 'vite';

const cwd = process.cwd();

export default async function zodernRelay(options?: Options): Promise<Plugin> {
    const config = {
        directories: {
            methods: options?.directories?.methods || ['./imports/methods'],
            publications: options?.directories?.publications || ['./imports/publications'],
        },
        shouldTransform: options?.shouldTransform || (({ content }) => content.includes(options?.relayPackageId || 'meteor/zodern:relay')),
    } satisfies Options;
    
    const directories = [
        ...config.directories.methods.map((path) => ['methods', Path.relative(cwd, path)]),
        ...config.directories.publications.map((path) => ['publications', Path.relative(cwd, path)])
    ] as [RelayInfo['type'], string][];
    
    function resolveRelay(id: string): RelayInfo | undefined {
        const relativePath = Path.relative(cwd, id);
        for (const [type, directory] of directories) {
            if (!relativePath.startsWith(directory)) {
                continue;
            }
            return {
                id,
                type,
                relativePath,
            }
        }
    }
    
    return {
        name: 'zodern-relay',
        async load(filename, fileOptions) {
            const relay = resolveRelay(filename || '');
            
            if (!relay) {
                return;
            }
            
            const code = FS.readFileSync(filename, 'utf-8');
            
            // Prevent transforming files that don't use zodern:relay
            if (!config.shouldTransform({ content: code, id: filename })) {
                return;
            }
            
            let arch = 'web.browser.vite';
            
            if (fileOptions?.ssr) {
                arch = 'os.vite.ssr';
            }
            
            const transform = await transformAsync(code, {
                configFile: false,
                babelrc: false,
                filename,
                presets: ['@babel/preset-typescript'], // Add TypeScript preset
                plugins: ['@zodern/babel-plugin-meteor-relay'],
                caller: {
                    name: '@meteor-vite/plugin-zodern-relay',
                    
                    // @ts-expect-error No type definition for this, but it's required by the Babel plugin.
                    arch,
                }
            });
            
            if (!transform) {
                return;
            }
            
            let newCode = transform.code ?? '';
            
            // Rewrite any newly added imports to use the correct package ID.
            // Only applicable when using a fork of zodern:relay.
            if (options?.relayPackageId) {
                newCode = newCode.replace('meteor/zodern:relay', options.relayPackageId);
            }
            
            return {
                code: newCode,
            }
        }
    }
    
    
}
export interface Options {
    directories?: {
        /**
         * Path to directories where your zodern:relay methods live
         * @default ['./imports/methods']
         */
        methods?: string[],
        
        /**
         * Path to the directories where your zodern:relay publications live.
         * @default ['./imports/publications']
         */
        publications?: string[],
    }
    /**
     * Specify a custom filter to determine whether a module should be transformed with zodern:relay.
     * Used to prevent unnecessary Babel transformations.
     * @default ({ content }) => content.includes('meteor/zodern:relay')
     * @param id
     */
    shouldTransform?: (file: { content: string, id: string }) => boolean;
    
    /**
     * If you're using a fork of zodern:relay, you should specify its Meteor import string here so imports
     * can be substituted with your fork. The Babel plugin currently injects a hardcoded import string for
     * client-code `zodern:relay/client`, so it's important we correct that before finishing the transform process.
     * @default 'meteor/zodern:relay'
     */
    relayPackageId?: string;
}

type RelayInfo = {
    type: 'methods' | 'publications';
    id: string;
    relativePath: string;
};
