import type { KubeManifest, MetadataLabels } from '@/lib/kubernetes/types/Generic';

export type ServiceManifest = KubeManifest<'Service', {
    ports: ServicePort[];
    selector: MetadataLabels;
    type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
    externalIPs?: string[];
    externalName?: string;
    loadBalancerIP?: string;
    loadBalancerSourceRanges?: string[];
    sessionAffinity?: 'None' | 'ClientIP';
    sessionAffinityConfig?: {
        clientIP: {
            timeoutSeconds: number;
        }
    }
}>

type ServicePort = {
    port: number;
    targetPort: number;
    name?: string;
}