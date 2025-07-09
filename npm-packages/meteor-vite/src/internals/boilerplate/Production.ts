import type { TransformedViteManifest } from '@/internals/scripts/createProductionCompilerPlugin';
import { createSimpleLogger, Logger, LoggerInstance, trimLeadingSlash } from '@/utilities/server';
import { WebAppInternals } from 'meteor/webapp';
import { URL } from 'node:url';
import { inspect } from 'node:util';
import Path from 'path';
import { type Boilerplate, ViteBoilerplate } from './Boilerplate';

export class ViteProductionBoilerplate extends ViteBoilerplate {
    
    protected readonly logger: LoggerInstance;
    protected readonly settings: Partial<{ manifest: TransformedViteManifest, imports: ManifestImports }>;
    protected readonly baseUrlType: 'path' | 'url' = 'path';
    
    constructor(public readonly viteManifest: TransformedViteManifest) {
        super();
        this.settings = { manifest: viteManifest };
        this.logger = createSimpleLogger('HTML Boilerplate');
        this.logger.info(`Serving Vite assets from ${this.baseUrl}`, {
            assetDir: this.assetDir,
            baseUrl: this.baseUrl,
        });
        if (this.baseUrl.match(/^\w+:\/\//)) {
            this.baseUrlType = 'url';
        }
    }
    
    public get assetDir() {
        return '/' + trimLeadingSlash(this.viteManifest.assetsDir);
    }
    
    public get baseUrl() {
        return this.viteManifest.base;
    }
    
    protected filePath(file: string) {
        if (this.baseUrlType === 'url') {
            return new URL(file, this.baseUrl).href;
        }
        return Path.join(this.baseUrl, file);
    }
    
    public getBoilerplate(): Boilerplate {
        return {
            dynamicHead: this.dynamicHead,
            dynamicBody: ''
        };
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
        let cacheable = 0;
        
        for (const arch of archs) {
            const files = WebAppInternals.staticFilesByArch[arch] || {};
            
            // Override cacheable flag for any assets built by Vite.
            // Meteor will by default set this to false for asset files.
            Object.entries(files).forEach(([path, file]) => {
                if (!path.startsWith(`${this.assetDir}/`)) {
                    this.logger.debug(`Not a Vite asset: ${path}`)
                    return;
                }
                if (path.endsWith('.js')) {
                    file.cacheable = true;
                }
                if (path.endsWith('.css')) {
                    file.cacheable = true;
                }
                this.logger.debug(`Marked as cacheable: ${path}`);
                cacheable++
            })
        }
        
        if (cacheable <= 0) {
            this.logger.warn('Found no Vite assets in Meteor client program manifest.')
            this.logger.warn('Static files served by Meteor have caching disabled by default, we were unable to override this setting.');
        }
        
        this.logger.info(`Marked ${cacheable.toLocaleString()} static Vite assets as cacheable`);
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
    
    protected get imports(): ManifestImports {
        if (this.settings?.imports) {
            return this.settings.imports;
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
        
        Logger.debug('Parsed Vite manifest imports', inspect({
            imports,
            manifest,
            modules,
        }, { depth: 4, colors: true }));
        
        Object.assign(this.settings, { imports });
        
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