import type { DeploymentManifest } from '@/lib/kubernetes/types/DeploymentManifest';
import type { IngressManifest } from '@/lib/kubernetes/types/IngressManifest';
import type { ServiceManifest } from '@/lib/kubernetes/types/ServiceManifest';

export type KubeResourceMap = {
    deployment: DeploymentManifest;
    service: ServiceManifest;
    ingress: IngressManifest;
}

export type KubeResourceType = keyof KubeResourceMap;

export type KubeResource<TType extends KubeResourceType = KubeResourceType> = KubeResourceMap[TType];