import FS from 'fs';
import type { TransformedViteManifest } from 'meteor-vite/meteor/IPC/methods/build';
import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import Path from 'path';
import Util from 'util';
import Logger from '../utility/Logger';
import { type Boilerplate, ViteBoilerplate } from './common';

export class ViteProductionBoilerplate extends ViteBoilerplate {
    
    constructor() {
        super();
    }
    
    public get assetDir() {
        return '/' + this.viteManifest.assetsDir.replace(/^\/+/, '');
    }
    
    public get baseUrl() {
        return this.viteManifest.base;
    }
    
    protected filePath(file: string) {
        return `${this.baseUrl.replace(/\/?$/, '')}/${file}`;
    }
    
    public getBoilerplate(): Boilerplate {
        return {
            dynamicHead: this.dynamicHead,
            dynamicBody: ''
        };
    }
    
    protected get dynamicHead() {
        const imports = this.imports;
        const lines = [];
        const prefetchArray: PrefetchObject[] = [];
        
        for (const file of imports.stylesheets) {
            lines.push(`<link rel="stylesheet" crossorigin href="${this.filePath(file)}">`);
        }
        
        for (const file of imports.modules) {
            lines.push(`<script type="module" crossorigin src="${this.filePath(file)}"></script>`);
        }
        
        for (const file of imports.modulePreload) {
            lines.push(`<link rel="modulepreload" crossorigin href="${this.filePath(file)}">`);
        }
        
        for (const file of imports.moduleLazyPrefetch) {
            prefetchArray.push({
                href: this.filePath(file),
            })
        }
        
        for (const file of imports.cssLazyPrefetch) {
            prefetchArray.push({
                href: this.filePath(file),
                as: 'style',
            })
        }
        
        function lazyPrefetch(assets: PrefetchObject[]) {
            window.addEventListener('load', () => window.setTimeout(() => {
                const makeLink = (asset: PrefetchObject) => {
                    const link = document.createElement('link')
                    link.rel = 'prefetch';
                    link.fetchPriority = 'low';
                    
                    Object.entries(asset).forEach(([key, value]) => {
                        link.setAttribute(key, value)
                    })
                    
                    return link
                }
                
                const loadNext = (assets: PrefetchObject[], count: number) => window.setTimeout(() => {
                    if (count > assets.length) {
                        count = assets.length
                        
                        if (count === 0) {
                            return
                        }
                    }
                    
                    const fragment = new DocumentFragment
                    
                    while (count > 0) {
                        const asset = assets.shift();
                        if (!asset) {
                            break;
                        }
                        const link = makeLink(asset)
                        fragment.append(link)
                        count--
                        
                        if (assets.length) {
                            link.onload = () => loadNext(assets, 1)
                            link.onerror = () => loadNext(assets, 1)
                        }
                    }
                    
                    document.head.append(fragment)
                })
                
                loadNext(assets, 3);
            }))
        }
        
        if (!process.env.DISABLE_FULL_APP_PREFETCH) {
            lines.push(
                `<script type="text/javascript">`,
                `${lazyPrefetch.toString()};`,
                `lazyPrefetch(${JSON.stringify(prefetchArray)})`,
                `</script>`
            )
        }
        
        return lines.join('\n');
    }
    
    public get viteManifest(): TransformedViteManifest {
        if (Meteor.settings.vite?.manifest) {
            return Meteor.settings.vite.manifest;
        }
        
        // Search Meteor's program.json file for Vite's manifest.json file
        const viteManifestInfo = WebApp.clientPrograms['web.browser'].manifest.find(({ path }: MeteorProgramManifest) => path.endsWith('vite-manifest.json'));
        if (!viteManifestInfo) {
            throw new Error('Could not find Vite manifest in Meteor client program manifest');
        }
        
        // Read and cache the contents of the vite manifest.json file.
        const viteManifestPath = Path.join(__meteor_bootstrap__.serverDir, '..', 'web.browser', viteManifestInfo.path);
        const manifest = JSON.parse(FS.readFileSync(viteManifestPath, 'utf8'));
        Meteor.settings.vite = { manifest };
        
        return manifest;
    }
    
    /**
     * Mark assets built by Vite as cacheable in Meteor's program.json file for both legacy and modern browsers.
     * Because of the way Meteor handles non-cacheable assets, headers are added that make it tricky to cache with
     * a standard reverse proxy config. You would have to explicitly override the caching headers for all files served
     * by meteor at /vite-assets.
     *
     * The default behavior of Meteor would be to set a max-age header of 0. Which would of course result in a lot of
     * load being put on both your clients and your server.
     */
    public makeViteAssetsCacheable() {
        const archs = ['web.browser', 'web.browser.legacy'] as const;
        
        for (const arch of archs) {
            const files = WebAppInternals.staticFilesByArch[arch] || {};
            
            // Override cacheable flag for any assets built by Vite.
            // Meteor will by default set this to false for asset files.
            Object.entries(files).forEach(([path, file]) => {
                if (!path.startsWith(`${this.assetDir}/`)) {
                    return;
                }
                if (path.endsWith('.js')) {
                    file.cacheable = true;
                }
                if (path.endsWith('.css')) {
                    file.cacheable = true;
                }
            })
        }
    }
    
    
    protected get imports(): ManifestImports {
        if (Meteor.settings.vite?.imports) {
            return Meteor.settings.vite.imports;
        }
        
        const manifest = this.viteManifest;
        const stylesheets = new Set<string>()
        const modules = new Set<string>()
        const modulePreload = new Set<string>();
        const moduleLazyPrefetch = new Set<string>();
        const cssLazyPrefetch = new Set<string>();
        
        function preloadImports(imports: string[]) {
            for (const path of imports) {
                const chunk = manifest.files[path];
                if (!chunk) {
                    continue;
                }
                if (modulePreload.has(chunk.file)) {
                    continue;
                }
                moduleLazyPrefetch.delete(chunk.file);
                modulePreload.add(chunk.file);
                chunk.css?.forEach(css => stylesheets.add(css));
                preloadImports(chunk.imports || []);
            }
            
        }
        
        // Todo: Preload all assets app assets in the background after loading essential assets.
        //  rel="preload" fetchPriority="low"
        for (const [name, chunk] of Object.entries(manifest.files)) {
            if (!chunk.isEntry) {
                if (chunk.file.endsWith('.js')) {
                    moduleLazyPrefetch.add(chunk.file);
                }
                if (chunk.file.endsWith('.css')) {
                    cssLazyPrefetch.add(chunk.file);
                }
                continue;
            }
            
            if (chunk.file.endsWith('.js')) {
                moduleLazyPrefetch.delete(chunk.file);
                modules.add(chunk.file);
            }
            
            if (chunk.file.endsWith('.css')) {
                stylesheets.add(chunk.file);
            }
            
            preloadImports(chunk.imports || []);
            
            chunk.css?.forEach(css => {
                stylesheets.add(css);
                cssLazyPrefetch.delete(css);
            });
        }
        
        const imports = {
            stylesheets,
            modules,
            modulePreload,
            moduleLazyPrefetch,
            cssLazyPrefetch,
        }
        
        Logger.debug('Parsed Vite manifest imports', Util.inspect({
            imports,
            manifest,
            modules,
        }, { depth: 4, colors: true }));
        
        Object.assign(Meteor.settings.vite, { imports });
        
        return imports;
    }
}

interface MeteorProgramManifest {
    path: string;
    url?: string;
    cacheable: boolean;
}

interface PrefetchObject {
    href: string;
    as?: 'style';
}

interface ManifestImports {
    stylesheets: Set<string>;
    modules: Set<string>;
    modulePreload: Set<string>;
    moduleLazyPrefetch: Set<string>;
    cssLazyPrefetch: Set<string>;
}