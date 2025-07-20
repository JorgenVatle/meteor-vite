import type { KubeManifest, MetadataLabels } from '@/lib/kubernetes/types/Generic';

export type ServiceManifest = KubeManifest<'Service', {
    ports: ServicePort[];
    selector: MetadataLabels;
}>

type ServicePort = {
    port: number;
    targetPort: number;
    name?: string;
}