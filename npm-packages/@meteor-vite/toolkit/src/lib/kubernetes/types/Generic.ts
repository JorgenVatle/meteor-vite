export type KubeManifest<Spec = undefined> = {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace?: string;
        labels?: Record<string, string>
        annotations?: Record<string, string>
    };
    spec: Spec;
}

export type KubeResourceList<TManifest = KubeManifest> = {
    kind: 'List';
    apiVersion: 'v1';
    metadata: {
        resourceVersion: string;
    };
    items: TManifest[];
}