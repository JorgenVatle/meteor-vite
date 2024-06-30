interface BoilerplateData {
    css: string[];
    js: {
        url: string;
        sri: string;
    }[];
    head: string;
    body: string;
    meteorManifest: string;
    additionalStaticJs: string[];
    meteorRuntimeConfig: string;
    meteorRuntimeHash: string;
    rootUrlPathPrefix: string;
    bundledJsCssUrlRewriteHook: Function;
    sriMode: undefined;
    inlineScriptsAllowed: boolean;
    inline: undefined;
    htmlAttributes: Record<string, unknown>;
    dynamicHead: string | undefined;
    dynamicBody: string | undefined;
}

export abstract class BoilerplateWorker {
    public abstract getBoilerplate(): Promise<{
        dynamicHead?: string;
        dynamicBody?: string;
    }>
}