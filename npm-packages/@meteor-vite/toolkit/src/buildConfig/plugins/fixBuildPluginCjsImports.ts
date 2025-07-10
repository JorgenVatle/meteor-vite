import type { ESBuildPlugin } from '@/buildConfig';
import { log } from '@/buildConfig/log';
import Path from 'node:path';
import pc from 'picocolors';

/**
 * Rewrite meteor-vite imports to enforce imports using ESM instead of
 * CommonJS.
 */
export function fixBuildPluginCjsImports(): ESBuildPlugin {
    return {
        name: 'fix-build-plugin-cjs-imports',
        setup(build) {
            build.onResolve({ filter: /^meteor-vite/ }, (args) => {
                const parsed = Path.parse(args.path);
                const packageRoot = parsed.dir;
                const relativePath = Path.relative('meteor-vite', args.path);
                
                const newPath = Path.join('meteor-vite', 'dist', `${relativePath}.mjs`);
                
                log(`Rewriting external ${pc.yellow(packageRoot)} import for Meteor build plugin: ${pc.blue(args.path)} -> ${pc.green(newPath)}`);
                
                return {
                    path: newPath,
                    external: true,
                }
            })
        }
    } satisfies ESBuildPlugin;
}