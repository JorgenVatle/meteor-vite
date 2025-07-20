import type { KubeManifest } from '@/lib/kubernetes/types/Generic';

export type DeploymentManifest = KubeManifest<'Deployment', {
    selector: {
        matchLabels: Record<string, string>;
    }
    template: PodTemplate
}>;

type PodTemplate = {
    metadata: {
        labels: Record<string, string>;
        annotations?: Record<string, string>;
    }
    spec: {
        containers: PodContainer[];
    }
}

type PodContainer = {
    name: string;
    image: string;
}