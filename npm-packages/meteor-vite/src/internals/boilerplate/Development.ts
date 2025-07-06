import { viteAssetUrl } from '../../utilities/Formatting';
import { type Boilerplate, ViteBoilerplate } from './Boilerplate';

export class ViteDevelopmentBoilerplate extends ViteBoilerplate {
    public readonly baseUrl: string;
    public readonly needsReactPreamble: boolean;
    public readonly clientEntry: string;
    
    constructor({ clientEntry, needsReactPreamble, baseUrl }: Pick<ViteDevelopmentBoilerplate, 'baseUrl' | 'needsReactPreamble' | 'clientEntry'>) {
        super();
        this.clientEntry = clientEntry;
        this.needsReactPreamble = needsReactPreamble;
        this.baseUrl = baseUrl;
        
        if (!baseUrl) {
            throw new Error('Unable to resolve base URL for Vite assets! Make sure you are importing meteor-vite as a plugin your Vite config');
        }
    }
    
    public getBoilerplate(arch: string): Boilerplate {
        // ⚡ [Client] Prepare module import scripts for the Meteor app HTML.
        const scripts = [
            '@vite/client',
            this.clientEntry
        ].map((path) => {
            return `<script src="${viteAssetUrl({ arch, path, base: this.baseUrl })}" type="module" crossorigin></script>`;
        });
        
        // ⚡ [Client/React] Add React HMR preamble
        if (this.needsReactPreamble) {
            scripts.unshift(`
                <script type="module">
                    import RefreshRuntime from "${viteAssetUrl({ arch, base: this.baseUrl, path: '@react-refresh' })}"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </script>
            `)
        }
        
        return {
            dynamicHead: scripts.join('\n'),
            dynamicBody: '',
        }
    }
}