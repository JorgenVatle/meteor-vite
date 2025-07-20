import type { KubeResourceList } from '@/lib/kubernetes/types/Generic';
import type { KubeResource, KubeResourceType } from '@/lib/kubernetes/types/ResourceTypes';
import { execa } from 'execa';

type Verb = 'get' | 'create' | 'delete' | 'apply';

class KubectlCli {
    protected async kubectl<
        TType extends KubeResourceType,
        TResource = KubeResource<TType>
    >(verb: Verb, ...params: string[]): Promise<KubeResourceList<TResource> | TResource> {
        const result = await execa('kubectl', [verb, ...params, '-o', 'json']);
        
        return JSON.parse(result.stdout);
    }
    
    public get<TType extends KubeResourceType>(resource: TType, options: { name?: string, params: string[] }): Promise<KubeResourceList<KubeResource<TType>> | KubeResource<TType>> {
        const args: string[] = [...options.params];
        if (options.name) {
            args.unshift(options.name);
        }
        return this.kubectl('get', resource, ...args);
    }
    public apply(manifest: KubeResource): Promise<unknown> {
        return this.kubectl('apply', '-f', '-', JSON.stringify(manifest));
    }
}

export const kubectl = new KubectlCli();