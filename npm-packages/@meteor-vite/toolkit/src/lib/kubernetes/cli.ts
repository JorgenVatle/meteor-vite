import type { KubeManifest, KubeResourceList } from '@/lib/kubernetes/types/Generic';
import { execa } from 'execa';

type Verb = 'get' | 'create' | 'delete' | 'apply';

export async function kubectl<
    T extends { kind: any } = KubeManifest | KubeResourceList
>(verb: Verb, resource: string, params: string[] = []): Promise<T> {
    const result = await execa('kubectl', [verb, resource, ...params, '-o', 'json']);
    
    return JSON.parse(result.stdout);
}