import FS from 'fs';
import type { TransformedViteManifest } from 'meteor-vite/meteor/IPC/methods/build';
import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import Path from 'path';
import Util from 'util';
import Logger from '../utility/Logger';
import { type Boilerplate, ViteBoilerplate } from './common';

export class ViteProductionBoilerplate extends ViteBoilerplate {
    
    public readonly baseUrl: string;
    protected readonly clientEntry?: string;
    protected readonly config: {
        useFullAppPrefetch: boolean,
    }
    
    constructor() {
        const { METEOR_VITE_ASSET_CDN_URL, DISABLE_FULL_APP_PREFETCH } = process.env;
        super();
        this.config = {
            useFullAppPrefetch: !!DISABLE_FULL_APP_PREFETCH,
        }
        
        this.baseUrl = this.viteManifest.base;
        this.clientEntry = this.viteManifest.clientEntry;
        
        if (METEOR_VITE_ASSET_CDN_URL) {
            this.baseUrl = METEOR_VITE_ASSET_CDN_URL;
        }
        
        // Use Meteor's absoluteUrl for non-URL Vite base paths
        // Ensures consistent mapping to Vite assets with non-root app paths.
        if (!this.baseUrl.match(/^\w+:\/\/./)) {
            this.baseUrl = Meteor.absoluteUrl(this.baseUrl.replace(/^\/+/, ''));
        }
    }
    
    public get assetDir() {
        return '/' + this.viteManifest.assetsDir.replace(/^\/+/, '');
    }
    
    protected assetUrl(file: string) {
        return `${this.baseUrl.replace(/\/?$/, '')}/${file}`;
    }
    
    public getBoilerplate(): Boilerplate {
        return {
            dynamicHead: this.preloadHTML.head,
            dynamicBody: this.preloadHTML.body,
        };
    }
    
    protected _preloadHTML?: { head: string, body: string };
    
    protected get preloadHTML() {
        if (this._preloadHTML) {
            return this._preloadHTML;
        }
        
        const head: string[] = [];
        const body: string[] = [];
        
        const imports = this.resolveImports();
        const prefetchArray: PrefetchObject[] = [];
        
        for (const file of imports.css) {
            head.push(`<link rel="stylesheet" crossorigin href="${this.assetUrl(file)}">`);
        }
        
        for (const file of imports.modules) {
            head.push(`<link rel="modulepreload" crossorigin href="${this.assetUrl(file)}">`);
        }
        
        for (const file of imports.cssPreload) {
            head.push(`<link rel="preload" as="style" crossorigin href="${this.assetUrl(file)}">`);
        }
        
        for (const file of imports.modulePreload) {
            head.push(`<link rel="modulepreload" crossorigin href="${this.assetUrl(file)}">`);
        }
        
        for (const file of imports.modules) {
            body.push(`<script type="module" crossorigin src="${this.assetUrl(file)}"></script>`);
        }
        
        for (const file of imports.moduleLazyPrefetch) {
            prefetchArray.push({
                href: this.assetUrl(file),
            })
        }
        
        for (const file of imports.cssLazyPrefetch) {
            prefetchArray.push({
                href: this.assetUrl(file),
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
        
        if (!this.config.useFullAppPrefetch) {
            head.push(
                `<script type="text/javascript">`,
                `${lazyPrefetch.toString()};`,
                `lazyPrefetch(${JSON.stringify(prefetchArray)})`,
                `</script>`
            )
        }
        
        return {
            head: head.join('\n'),
            body: body.join('\n'),
        }
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
    
    
    protected resolveImports(): ManifestImports {
        if (Meteor.settings.vite?.imports) {
            return Meteor.settings.vite.imports;
        }
        
        const manifest = this.viteManifest;
        
        const modules = new Set<string>();
        const modulePreload = new Set<string>();
        const moduleLazyPrefetch = new Set<string>();
        
        const css = new Set<string>();
        const cssPreload = new Set<string>();
        const cssLazyPrefetch = new Set<string>();
        
        function preloadStaticImports(imports: string[]) {
            for (const path of imports) {
                const chunk = manifest.files[path];
                if (!chunk) {
                    continue;
                }
                if (modulePreload.has(chunk.file)) {
                    continue;
                }
                preload(chunk.file);
                chunk.css?.forEach(file => cssPreload.add(file));
                preloadStaticImports(chunk.imports || []);
            }
            
        }
        
        function lazyPreload(file: string) {
            if (file.endsWith('.js')) {
                if (modules.has(file)) return;
                if (modulePreload.has(file)) return;
                return moduleLazyPrefetch.add(file);
            }
            if (file.endsWith('.css')) {
                if (css.has(file)) return;
                if (cssPreload.has(file)) return;
                return cssLazyPrefetch.add(file);
            }
        }
        
        function preload(file: string) {
            if (file.endsWith('.js')) {
                moduleLazyPrefetch.delete(file);
                
                if (modules.has(file)) {
                    return
                }
                
                return modulePreload.add(file);
            }
            if (file.endsWith('.css')) {
                cssLazyPrefetch.delete(file);
                
                if (css.has(file)) {
                    return
                }
                
                return cssPreload.add(file);
            }
        }
        
        function load(file: string) {
            if (file.endsWith('.js')) {
                modulePreload.delete(file);
                moduleLazyPrefetch.delete(file);
                return modules.add(file);
            }
            if (file.endsWith('.css')) {
                cssPreload.delete(file);
                cssLazyPrefetch.delete(file);
                return css.add(file);
            }
        }
        
        // Todo: Preload all assets app assets in the background after loading essential assets.
        //  rel="preload" fetchPriority="low"
        for (const [name, chunk] of Object.entries(manifest.files)) {
            // Non-entry chunks
            if (!chunk.isEntry) {
                lazyPreload(chunk.file);
                continue;
            }
            
            // Vite entry module (Entries added by plugins)
            if (this.clientEntry && chunk.src !== this.clientEntry) {
                lazyPreload(chunk.file);
                continue
            }
            
            // Meteor-Vite entry module (Actual entry module for the app)
            load(chunk.file);
            preloadStaticImports(chunk.imports || []);
            
            chunk.css?.forEach(file => css.add(file));
            chunk.dynamicImports?.forEach((file) => lazyPreload(file));
        }
        
        const imports = {
            modules,
            modulePreload,
            moduleLazyPrefetch,
            css,
            cssPreload,
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

interface ViteChunk {
    file: string;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
    isEntry?: true,
    isDynamicEntry?: true,
}

interface ManifestImports {
    modules: Set<string>;
    modulePreload: Set<string>;
    moduleLazyPrefetch: Set<string>;
    css: Set<string>;
    cssPreload: Set<string>;
    cssLazyPrefetch: Set<string>;
}