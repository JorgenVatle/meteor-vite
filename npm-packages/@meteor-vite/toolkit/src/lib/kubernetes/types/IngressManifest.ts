import type { KubeManifest } from '@/lib/kubernetes/types/Generic';

export type IngressManifest = KubeManifest<{
    rules: IngressRule[]
}>;

type IngressRule = {
    host: string;
    http: {
        paths: IngressHttpPath[];
    }
}

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