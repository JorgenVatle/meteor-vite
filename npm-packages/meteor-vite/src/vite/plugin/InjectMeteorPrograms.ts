import FS from 'fs/promises';
import { MeteorProgram } from '../../meteor/InternalTypes';
import { MeteorViteConfig } from '../MeteorViteConfig';
import { PluginSettings } from './MeteorStubs';
import { Plugin } from 'vite';
import Path from 'path';


export default async function InjectMeteorPrograms(pluginSettings:  Pick<PluginSettings, 'meteor'>) {
    let resolvedConfig: MeteorViteConfig;
    
    const path = Path.join(pluginSettings.meteor.packagePath, '../program.json');
    const program: MeteorProgram = JSON.parse(await FS.readFile(path, 'utf-8'));
    const virtualImports: string[] = []
    program.manifest.forEach((entry) => {
        if (entry.type === 'js') {
            virtualImports.push(`import '\0${Path.join(path, '../', entry.path).replace(/^\/+/, '')}';`)
        }
    })
    
    return {
        name: 'meteor-vite: inject Meteor Programs HTML',
        configResolved(config) {
            resolvedConfig = config;
        },
        
        resolveId(id) {
            if (id.startsWith('.meteor')) {
                return `\0${id}`
            }
            if (id.startsWith('virtual:meteor-bundle')) {
                return `\0${id}`
            }
            if (id.startsWith('\0.meteor')) {
                return id;
            }
        },
        
        /**
         * Create a virtual meteor bundle for directly pulling in Meteor code into Vite.
         * This is done primarily for instances where Vite is acting as the sole user-facing server. E.g. when doing
         * SSR through Vite and Meteor is only used as a real-time API server.
         */
        async load(id) {
            id = id.slice(1);
            if (id.startsWith('virtual:meteor-bundle')) {
                return virtualImports.join('\n');
            }
            if (!id.startsWith('.meteor')) {
                return;
            }
            const filePath = Path.join(process.cwd(), id);
            const content = await FS.readFile(filePath, 'utf-8');
            if (id.endsWith('global-imports.js')) {
                const newContent = content.split(/[\r\n]/).map((line) => line.replace(/^(\w+) =/, 'globalThis.$1 =')).join('\n');
                return newContent;
            }
            return content.replace(/global = this/g, 'global = globalThis')
                          .replace(/^([\w]+) =/gi, 'globalThis.$1 =');
        },
        
        /**
         * When acting as the frontend server in place of Meteor, inject Meteor's package import scripts into the
         * server-rendered page.
         */
        async transformIndexHtml() {
            if (resolvedConfig.meteor?.viteMode !== 'ssr') return;
            
            const path = Path.join(pluginSettings.meteor.packagePath, '../program.json');
            const program: MeteorProgram = JSON.parse(await FS.readFile(path, 'utf-8'));
            let imports: HtmlTagDescriptor[] = [];
            
            const assetUrl = (manifest: MeteorManifest) => {
                const base = pluginSettings.meteor.runtimeConfig.ROOT_URL.replace(/^\/*/, '');
                const path = manifest.url.replace(/^\/*/, '');
                return `${base}${path}`;
            }
            
            imports.push({ tag: 'script', attrs: { type: 'text/javascript', src: 'http://localhost:3000/__meteor_runtime_config.js' } })
            
            program.manifest.forEach((asset) => {
                if (asset.type === 'css') {
                    imports.push({ tag: 'link', injectTo: 'head', attrs: { href: assetUrl(asset), rel: 'stylesheet' } })
                }
                if (asset.type === 'js') {
                    imports.push({ tag: 'script', injectTo: 'head', attrs: { type: 'text/javascript', src: assetUrl(asset) } })
                }
            })
            
            return imports;
        },
    } satisfies Plugin;
}