import type { KubeManifest } from '@/lib/kubernetes/types/Generic';

export type IngressManifest = KubeManifest<{
    rules: [
        http: {
            host: string;
            paths: IngressHttpPath[]
        }
    ]
}>;

export type IngressHttpPath = {
    path: string;
    pathType: string;
    backend: {
        service: {
            name: string;
            port: {
                number: number;
            }
        }
    }
}