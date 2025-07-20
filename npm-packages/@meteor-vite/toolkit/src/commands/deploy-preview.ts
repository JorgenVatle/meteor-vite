import { CommandDefinition } from '@/lib/CommandDefinition';
import { kubectl } from '@/lib/kubernetes/cli';
import type { IngressHttpPath } from '@/lib/kubernetes/types';
import type { KubeManifest } from '@/lib/kubernetes/types/Generic';
import { execa } from 'execa';
import FS from 'fs/promises';
import { inspect } from 'node:util';
import { parse } from 'yaml';
import { envOverride } from '~/meteor-vite/utilities/server/EnvFlag';

const SHORT_SHA = process.env.GITHUB_SHA
                  ? `sha-${process.env.GITHUB_SHA.slice(0, 7)}`
                  : null;

export default [
    new CommandDefinition('kube-deploy', {
        title: 'Deploy a preview to Kubernetes',
        description: 'Creates a temporary deployment to a Kubernetes cluster for previewing changes from pull requests or branches.',
        fields: {
            'app-name': {
                type: String,
                description: 'Name of the application. Used to identify the deployment and associated resources.',
                defaultValue: process.env.APP_NAME,
            },
            'git-ref': {
                type: String,
                description: 'Branch or pull request ID. Uniquely identifies the deployment. Will be inferred from the current environment.',
                defaultValue: process.env.GITHUB_REF_NAME!,
            },
            namespace: {
                type: String,
                description: 'Kubernetes namespace to deploy to',
                defaultValue: process.env.KUBE_NAMESPACE,
                alias: 'n',
            },
            manifest: {
                type: String,
                alias: 'f',
                description: `Path to the Kubernetes manifest file to apply. Environment variables will be interpolated. Use "\${SOME_VARIABLE}" to substitute in values from the environment.`,
            },
            'delete-after-duration': {
                type: String,
                description: 'Duration to wait before deleting the deployment and associated resources. Ex. 10m, 1h, 1d.',
                defaultValue: '10m',
            },
            image: {
                type: String,
                description: 'Docker image to use for the deployment.',
                defaultValue: process.env.DOCKER_IMAGE,
            },
            version: {
                type: String,
                description: 'Docker image tag to use for the deployment.',
                defaultValue: envOverride('APP_VERSION', SHORT_SHA),
            },
            'base-path': {
                type: String,
                description: 'Base path to use for the deployment. This will be used to configure the ingress.',
                defaultValue: process.env.BASE_PATH || '/',
            },
            port: {
                type: String,
                description: 'Port to use for the deployment. This will be used to configure the ingress.',
                defaultValue: process.env.PORT || '3000',
            },
            ingress: {
                type: String,
                description: 'Name of the ingress to associate the deployment with.',
                defaultValue: process.env.INGRESS_NAME,
                optional: true,
            }
        },
        handler: async (options) => {
            const gitRef = options['git-ref'].replaceAll('/', '-');
            const manifests = await parseManifest(options.manifest, {
                KUBE_NAMESPACE: options.namespace,
                GIT_REF: options['git-ref'],
                DOCKER_IMAGE: options.image,
                APP_VERSION: options.version,
                ...process.env,
            });
            
            const instance = `${options['app-name']}-${gitRef}`;
            
            console.log(manifests, { options });
            for (const manifest of manifests) {
                Object.assign(manifest.metadata, {
                    name: instance,
                    namespace: options.namespace,
                    labels: Object.assign({
                        'app.kubernetes.io/name': options['app-name'],
                        'app.kubernetes.io/instance': instance,
                        'app.kubernetes.io/version': options.version,
                        'app.kubernetes.io/managed-by': '@meteor-vite/toolkit',
                        'toolbox.meteor-vite.io/app-name': options['app-name'],
                        'toolbox.meteor-vite.io/git-ref': gitRef,
                        'toolbox.meteor-vite.io/repository': process.env.GITHUB_REPOSITORY,
                        'toolbox.meteor-vite.io/ingress': options.ingress,
                    }, manifest.metadata.labels),
                    annotations: Object.assign({
                        'toolbox.meteor-vite.io/delete-after-duration': options['delete-after-duration'],
                        'toolbox.meteor-vite.io/base-path': options['base-path'],
                        'toolbox.meteor-vite.io/port': options.port,
                    }, manifest.metadata.annotations),
                });
            }
            
            if (process.env.GITHUB_STEP_SUMMARY) {
                await FS.appendFile(
                    process.env.GITHUB_STEP_SUMMARY,
                    summary('Kubernetes manifests', codeBlock('json', JSON.stringify(manifests, null, 2))),
                );
            }
            
            console.log(inspect(manifests, { colors: true, depth: 10 }));
        },
    }),
    
    new CommandDefinition('kube-sync-ingress', {
        title: 'Patch ingress with current deployments',
        description: 'Updates the provided ingress with paths from annotated preview deployments.',
        fields: {
            ingress: {
                type: String,
                description: 'Name of the ingress to update',
            },
            namespace: {
                type: String,
                description: 'Kubernetes namespace to deploy to',
                alias: 'n',
                defaultValue: process.env.KUBE_NAMESPACE!,
            },
        },
        handler: async ({ namespace, ingress }) => {
            const services = await kubectl.get('service', {
                namespace: namespace,
                labels: [
                    ['toolbox.meteor-vite.io/ingress', '==', ingress]
                ]
            });
            const paths: IngressHttpPath[] = [];
            
            for (const service of services.items) {
                const annotations = service.metadata.annotations;
                if (!annotations) {
                    continue;
                }
                
                const basePath = annotations['toolbox.meteor-vite.io/base-path'];
                if (!basePath) {
                    continue;
                }
                
                const port = service.spec?.ports[0];
                if (!port) {
                    continue;
                }
                
                paths.push({
                    path: basePath,
                    pathType: 'Prefix',
                    backend: {
                        service: {
                            name: service.metadata.name,
                            port: {
                                number: service.spec.ports[0].port,
                            },
                        },
                    },
                });
            }
            
            console.log(inspect({ services, paths }, { colors: true, depth: 10 }));
            
            await kubectl.patch('ingress', ingress, {
                    spec: {
                        rules: [
                            {
                                http: { paths },
                            },
                        ],
                    },
                }, { namespace },
            );
        },
    }),
];

async function parseManifest(filePath: string, envsubst: Record<string, any>): Promise<KubeManifest[]> {
    const manifestInput = await FS.readFile(filePath, 'utf8');
    const result = await execa('echo', [manifestInput], {
        env: {
            ...envsubst,
            ...process.env,
        },
    }).pipe`envsubst`;
    
    return result.stdout.split('---').map((block) => parse(block)).filter(Boolean);
}

function codeBlock(language: string, content: string) {
    return [
        '```' + language,
        content,
        '```',
    ].join('\n');
}

function summary(title: string, content: string) {
    return `
<details>
<summary>${title}</summary>

${content}
</details>
`;
}
