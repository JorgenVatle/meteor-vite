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