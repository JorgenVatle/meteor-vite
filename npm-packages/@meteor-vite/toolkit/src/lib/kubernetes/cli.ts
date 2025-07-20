import type { KubeResourceList } from '@/lib/kubernetes/types/Generic';
import type { KubeResource, KubeResourceType } from '@/lib/kubernetes/types/ResourceTypes';
import { execa } from 'execa';
import pc from 'picocolors';

type Verb = 'get' | 'create' | 'delete' | 'apply';

class KubectlCli {
    protected async kubectl<
        TType extends KubeResourceType,
        TResource = KubeResource<TType>
    >(verb: Verb, params: string[], options: UniversalOptions): Promise<KubeResourceList<TResource> | TResource> {
        const args: string[] = [...params || []];
        
        if (options.namespace) {
            args.push('-n', options.namespace);
        }
        
        if (options.label) {
            Object.entries(options.label).forEach(([key, value]) => {
                args.push(`--label`, `${key}=${value}`);
            })
        }
        
        const result = await execa('kubectl', [verb, ...args, '-o', 'json']).catch((error: unknown) => {
            echoCommand(error);
            throw error;
        });
        
        echoCommand(result);
        
        return JSON.parse(result.stdout);
    }
    
    public get<TType extends KubeResourceType>(resource: TType, options: Omit<CommandOptions, 'name'>): Promise<KubeResourceList<KubeResource<TType>>>
    public get<TType extends KubeResourceType>(resource: TType, options: { name: string } & Omit<CommandOptions, 'name'>): Promise<KubeResource<TType>>
    public get<TType extends KubeResourceType>(resource: TType, options: CommandOptions): Promise<KubeResourceList<KubeResource<TType>> | KubeResource<TType>> {
        const args: string[] = [...options.params || []];
        if (options.name) {
            args.unshift(options.name);
        }
        
        return this.kubectl('get', [resource, ...args], options);
    }
    
    public apply(manifest: KubeResource): Promise<unknown> {
        return this.kubectl('apply', ['-f', '-', JSON.stringify(manifest)], {});
    }
}

function echoCommand(result: unknown) {
    if (!result) {
        return;
    }
    if (typeof result !== 'object') {
        return;
    }
    if (!('command' in result) || typeof result.command !== 'string') {
        return;
    }
    console.log(['$', pc.dim(result.command)])
}

interface UniversalOptions {
    label?: Record<string, string>;
    namespace?: string;
}

interface CommandOptions extends UniversalOptions {
    name?: string;
    params?: string[];
}

export const kubectl = new KubectlCli();