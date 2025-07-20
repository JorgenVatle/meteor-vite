import type { KubeResourceList } from '@/lib/kubernetes/types/Generic';
import type { KubeResource, KubeResourceType } from '@/lib/kubernetes/types/ResourceTypes';
import { execa } from 'execa';

type Verb = 'get' | 'create' | 'delete' | 'apply';

export function kubectl<
    TType extends KubeResourceType,
    TResource = KubeResource<TType>
>(verb: 'get', resource: TType, params: [name: string]): Promise<TResource>

export function kubectl<
    TType extends KubeResourceType,
    TResource = KubeResource<TType>
>(verb: 'get', resource: TType, params: []): Promise<KubeResourceList<TResource>>

export async function kubectl<
    TType extends KubeResourceType,
    TResource = KubeResource<TType>
>(verb: Verb, resource: TType, params: string[] = []): Promise<KubeResourceList<TResource> | TResource> {
    const result = await execa('kubectl', [verb, resource, ...params, '-o', 'json']);
    
    return JSON.parse(result.stdout);
}