import type { KubeManifest } from '@/lib/kubernetes/types/Generic';

export type ServiceManifest = KubeManifest<'Service', {
    ports: ServicePort[];
}>

type ServicePort = {
    port: number;
    targetPort: number;
    name?: string;
}