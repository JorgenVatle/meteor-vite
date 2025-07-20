import { CommandDefinition } from '@/lib/CommandDefinition';
import { kubectl } from '@/lib/kubernetes/cli';
import type { IngressHttpPath } from '@/lib/kubernetes/types';
import type { KubeResource } from '@/lib/kubernetes/types/ResourceTypes';
import { execa } from 'execa';
import FS from 'fs/promises';
import Path from 'node:path';
import { inspect } from 'node:util';
import { parse } from 'yaml';
import { envOverride } from '~/meteor-vite/utilities/server/EnvFlag';

const SHORT_SHA = process.env.GITHUB_SHA
                  ? `sha-${process.env.GITHUB_SHA.slice(0, 7)}`
                  : null;

const COMMON_FIELDS = {
    namespace: {
        type: String,
        description: 'Kubernetes namespace to deploy to',
        defaultValue: process.env.KUBE_NAMESPACE,
        alias: 'n',
    },
    ingress: {
        type: String,
        description: 'Name of the ingress to associate the deployment with.',
        defaultValue: process.env.KUBE_INGRESS_NAME!,
    },
    summaryFile: {
        type: String,
        description: 'Path to a file to write a summary of the deployment to.',
        defaultValue: process.env.GITHUB_STEP_SUMMARY || '.logs/kube-deploy-summary.md',
    },
    githubOutput: {
        type: String,
        description: 'File path to write output variables to. Used for GitHub Actions output',
        defaultValue: process.env.GITHUB_OUTPUT || '.logs/kube-deploy-manifests.yaml',
    },
}

const COMMON_DEPLOYMENT_FIELDS = {
    'app-name': {
        type: String,
        description: 'Name of the application. Used to identify the deployment and associated resources.',
        defaultValue: process.env.KUBE_APP_NAME,
    },
    'git-ref': {
        type: (value: string) => {
            console.log({ value });
            return value.replaceAll('/', '-');
        },
        description: 'Branch or pull request ID. Uniquely identifies the deployment. Will be inferred from the current environment.',
        defaultValue: process.env.GITHUB_REF_NAME!,
    },
}

export default [
    new CommandDefinition('kube-deploy', {
        title: 'Deploy a preview to Kubernetes',
        description: 'Creates a temporary deployment to a Kubernetes cluster for previewing changes from pull requests or branches.',
        fields: {
            ...COMMON_FIELDS,
            ...COMMON_DEPLOYMENT_FIELDS,
            manifest: {
                type: String,
                alias: 'f',
                description: `Path to the Kubernetes manifest file to apply. Environment variables will be interpolated. Use "\${SOME_VARIABLE}" to substitute in values from the environment.`,
            },
            'delete-after-duration': {
                type: String,
                description: 'Duration to wait before deleting the deployment and associated resources. Ex. 10m, 1h, 1d.',
                defaultValue: envOverride('KUBE_REMOVE_AFTER', undefined),
            },
            image: {
                type: String,
                description: 'Docker image to use for the deployment.',
                defaultValue: process.env.KUBE_CONTAINER_IMAGE,
            },
            version: {
                type: String,
                description: 'Docker image tag to use for the deployment.',
                defaultValue: envOverride('KUBE_APP_VERSION', SHORT_SHA),
            },
            'base-path': {
                type: String,
                description: 'Base path to use for the deployment. This will be used to configure the ingress.',
                defaultValue: process.env.KUBE_INGRESS_BASE_PATH || '/',
            },
            port: {
                type: String,
                description: 'Port to use for the deployment. This will be used to configure the ingress.',
                defaultValue: process.env.KUBE_CONTAINER_PORT || '3000',
            },
        },
        handler: async (options) => {
            const manifests = await parseManifest(options.manifest, {
                KUBE_NAMESPACE: options.namespace,
                GIT_REF: options['git-ref'],
                DOCKER_IMAGE: options.image,
                APP_VERSION: options.version,
                PORT: options.port,
            });
            
            const instance = `${options['app-name']}-${options['git-ref']}`;
            const githubOutput = {
                deploymentName: instance,
            }
            
            console.log(manifests, { options });
            for (const manifest of manifests) {
                const { labels } = Object.assign(manifest.metadata, {
                    labels: manifest.metadata.labels || {}
                });
                
                const selectorLabels = {
                    'app.kubernetes.io/name': options['app-name'],
                    'app.kubernetes.io/instance': instance,
                }
                
                Object.assign(labels, selectorLabels);
                
                const [repositoryOwner, repositoryName] = (process.env.GITHUB_REPOSITORY || 'unknown/unknown')?.split('/');
                
                Object.entries({
                    'app.kubernetes.io/managed-by': 'toolkit.meteor-vite.io',
                    'app.kubernetes.io/version': options.version,
                    'app.kubernetes.io/git-ref': 'preview',
                    'toolkit.meteor-vite.io/repository-name': repositoryName,
                    'toolkit.meteor-vite.io/repository-namespace': repositoryOwner,
                    'toolkit.meteor-vite.io/ingress': options.ingress,
                }).forEach(([key, value]) => {
                    labels[key] = labels[key] || value || 'not-defined';
                });
                
                Object.assign(manifest.metadata, {
                    name: instance,
                    namespace: options.namespace,
                    labels,
                    annotations: Object.assign({
                        'toolkit.meteor-vite.io/delete-after-duration': options['delete-after-duration'],
                        'toolkit.meteor-vite.io/base-path': options['base-path'],
                        'toolkit.meteor-vite.io/port': options.port,
                        'toolkit.meteor-vite.io/repository-url': process.env.GITHUB_REPOSITORY_URL,
                    }, manifest.metadata.annotations),
                });
                
                if (manifest.kind === 'Deployment') {
                    manifest.spec.selector.matchLabels = Object.assign({}, selectorLabels, manifest.spec.selector.matchLabels);
                    manifest.spec.template.metadata.labels = Object.assign({}, selectorLabels, manifest.spec.template.metadata.labels);
                }
                
                if (manifest.kind === 'Service') {
                    manifest.spec.selector = Object.assign({}, selectorLabels, manifest.spec.selector);
                }
            }
            
            if (options.summaryFile) {
                await FS.mkdir(Path.dirname(options.summaryFile), { recursive: true });
                await FS.appendFile(
                    options.summaryFile,
                    summary('Kubernetes manifests', codeBlock('json', JSON.stringify(manifests, null, 2))),
                );
            }
            
            if (options.githubOutput) {
                await FS.mkdir(Path.dirname(options.githubOutput), { recursive: true });
                await FS.writeFile(
                    options.githubOutput,
                    Object.entries(githubOutput).map(([key, value]) => `${key}='${value}'`).join('\n'),
                );
            }
            
            console.log(inspect(manifests, { colors: true, depth: 10 }));
            for (const manifest of manifests) {
                await kubectl.apply(manifest, { namespace: options.namespace });
            }
        },
    }),
    
    new CommandDefinition('kube-verify-deployment', {
        title: 'Verify deployment',
        description: 'Verify that a deployment has been rolled out successfully.',
        fields: {
            ...COMMON_FIELDS,
            ...COMMON_DEPLOYMENT_FIELDS,
            deploymentTimeout: {
                type: String,
                description: 'Duration to wait for pods to become ready and consider the deployment successful. Ex. 30s, 1m, 1h.',
                defaultValue: envOverride('KUBE_DEPLOYMENT_TIMEOUT', '30s'),
            }
        },
        handler: async (options) => {
            const instance = `${options['app-name']}-${options['git-ref']}`;
            
            await kubectl.waitForDeploymentSuccess(instance, options.deploymentTimeout, { namespace: options.namespace });
        },
    }),
    
    new CommandDefinition('kube-sync-ingress', {
        title: 'Patch ingress with current deployments',
        description: 'Updates the provided ingress with paths from annotated preview deployments.',
        fields: {
            ...COMMON_FIELDS,
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
            
            if (!paths.length) {
                throw new Error(`No matching services found for ingress: ${ingress}`);
            }
            
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

async function parseManifest(filePath: string, envsubst: Record<string, any>): Promise<KubeResource[]> {
    const manifestInput = await FS.readFile(filePath, 'utf8');
    const result = await execa('echo', [manifestInput]).pipe(`envsubst`, [], {
        env: {
            ...process.env,
            ...envsubst,
        },
    });
    
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
