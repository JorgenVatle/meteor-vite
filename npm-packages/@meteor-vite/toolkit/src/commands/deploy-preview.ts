import { CommandDefinition } from '@/lib/CommandDefinition';
import { kubectl } from '@/lib/kubernetes/cli';
import type { IngressHttpPath } from '@/lib/kubernetes/types';
import type { KubeResource } from '@/lib/kubernetes/types/ResourceTypes';
import { addDays, format, formatDistanceToNow, isPast } from 'date-fns';
import { execa } from 'execa';
import FS from 'fs/promises';
import Path from 'node:path';
import { inspect } from 'node:util';
import pc from 'picocolors';
import { parse } from 'yaml';
import { envOverride } from '~/meteor-vite/utilities/server/EnvFlag';

const SHORT_SHA = process.env.GITHUB_SHA
                  ? `sha-${process.env.GITHUB_SHA.slice(0, 7)}`
                  : null;

const COMMON_FIELDS = {
    namespace: {
        type: String,
        description: 'Kubernetes namespace to deploy to',
        defaultValue: process.env.KUBE_NAMESPACE!,
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
        defaultValue: process.env.REF_TAG || process.env.GITHUB_REF_NAME!,
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
            pullRequestId: {
                type: String,
                description: 'ID of the pull request to deploy. Used to apply a comment with the preview URL.',
                defaultValue: process.env.PULL_REQUEST_ID,
                optional: true,
            }
        },
        handler: async (options) => {
            const manifests = await parseManifest(options.manifest, {
                KUBE_NAMESPACE: options.namespace,
                GIT_REF: options['git-ref'],
                DOCKER_IMAGE: options.image,
                APP_VERSION: options.version,
                PORT: options.port,
            });
            
            const instance = `${options['app-name']}.${options['git-ref']}`;
            const deleteAt = options['delete-after-duration'] ? DeletionAnnotation.create(options['delete-after-duration']) : null;
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
                    'app.kubernetes.io/git-ref': options['git-ref'],
                    'toolkit.meteor-vite.io/repository-name': repositoryName,
                    'toolkit.meteor-vite.io/repository-namespace': repositoryOwner,
                    'toolkit.meteor-vite.io/ingress': options.ingress,
                    'toolkit.meteor-vite.io/deployment-type': deleteAt ? 'temporary' : 'permanent',
                }).forEach(([key, value]) => {
                    labels[key] = labels[key] || value || 'not-defined';
                });
                
                Object.assign(manifest.metadata, {
                    name: instance,
                    namespace: options.namespace,
                    labels,
                    annotations: Object.assign({
                        'toolkit.meteor-vite.io/delete-at': deleteAt?.toJSON(),
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
                    
                    // Services don't allow '.' characters in its name, while deployments do.
                    manifest.metadata.name = manifest.metadata.name.replaceAll('.', '-')
                }
            }
            
            if (options.summaryFile) {
                await FS.mkdir(Path.dirname(options.summaryFile), { recursive: true });
                await FS.appendFile(
                    options.summaryFile,
                    summary({
                        title: 'Kubernetes manifests',
                        content: codeBlock('json', JSON.stringify(manifests, null, 2)),
                        url: process.env.ROOT_URL || options['base-path'],
                    }),
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
    
    new CommandDefinition('pr-comment-preview-url', {
        title: 'Comment on pull request with preview URL',
        description: 'Comment on a pull request with a link to the preview URL.',
        fields: {
            ...COMMON_DEPLOYMENT_FIELDS,
            ...COMMON_FIELDS,
            pullRequestId: {
                type: String,
                description: 'ID of the pull request to deploy. Used to apply a comment with the preview URL.',
                defaultValue: process.env.PULL_REQUEST_ID,
                optional: true,
            }
        },
        handler: async (options) => {
            if (!options.pullRequestId) {
                console.warn('No pull request ID provided. Skipping comment step.');
                return;
            }
            const comment = `Preview for **${options['app-name']}** deployed to ${process.env.ROOT_URL || '(missing ROOT_URL)'}`;
            await gh.patchPrComment(options.pullRequestId, comment);
        }
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
            const instance = `${options['app-name']}.${options['git-ref']}`;
            
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
                    ['toolkit.meteor-vite.io/ingress', '==', ingress]
                ]
            });
            const paths: IngressHttpPath[] = [];
            
            for (const service of services.items) {
                const annotations = service.metadata.annotations;
                if (!annotations) {
                    continue;
                }
                
                const basePath = annotations['toolkit.meteor-vite.io/base-path'];
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
    
    new CommandDefinition('kube-prune-temporary-deployments', {
        title: 'Prune temporary deployments',
        description: 'Remove temporary/preview deployments that have exceeded their desired lifetime.',
        fields: {
            ...COMMON_FIELDS,
        },
        handler: async (options) => {
            const deployments = await kubectl.get('deployment', {
                namespace: options.namespace,
                labels: [['toolkit.meteor-vite.io/deployment-type', '==', 'temporary']]
            });
            const summary: { pruned: string[], stillValid: string[], logs: string[] } = {
                pruned: [],
                stillValid: [],
                logs: [],
            }
            
            console.log(`Fetched ${deployments.items.length} temporary deployments.`);
            
            for (const deployment of deployments.items) {
                const deletion = DeletionAnnotation.fromManifest(deployment);
                const nameLabel = pc.cyan(deployment.metadata.name);
                
                if (deletion.shouldDelete) {
                    console.log(`Deployment ${nameLabel} has expired ${pc.yellow(deletion.distanceToNow.delete)} (${deletion.date.delete})`);
                    summary.pruned.push(`- Deleted \`${deployment.metadata.name}\` which had been hibernated since ${deletion.distanceToNow.hibernate}: (${deletion.date.hibernate})`);
                 
                    const result = await kubectl.delete(['deployment', 'service'], '', {
                        namespace: options.namespace,
                        labels: [['app.kubernetes.io/instance', '==', deployment.metadata.labels!['app.kubernetes.io/instance'] || deployment.metadata.name]] })
                    summary.logs.push(result);
                    continue;
                }
                
                if (!deletion.shouldHibernate) {
                    console.log(`Deployment ${nameLabel} is still valid and will be hibernated ${pc.yellow(deletion.distanceToNow.hibernate)} (${deletion.date.hibernate})`);
                    summary.stillValid.push(`- Deployment \`${deployment.metadata.name}\` is still valid and will be hibernated ${deletion.distanceToNow.hibernate} (${deletion.date.hibernate})`);
                    continue;
                }
                
                if (deployment.spec.replicas === 0) {
                    console.log(`Deployment ${nameLabel} is hibernated and will be deleted ${pc.yellow(deletion.distanceToNow.delete)} (${deletion.date.delete})`);
                    summary.logs.push(`Deployment \`${deployment.metadata.name}\` is hibernated and will be deleted ${deletion.distanceToNow.delete} (${deletion.date.delete})`);
                    continue;
                }
                
                console.log(`Hibernating deployment that expired ${deletion.distanceToNow.hibernate}: ${nameLabel} (${deletion.date.hibernate})`);
                summary.pruned.push(`- Hibernated \`${deployment.metadata.name}\` which expired ${deletion.distanceToNow.hibernate} (${deletion.date.hibernate})`);
                const result = await kubectl.patch('deployment', deployment.metadata.name, { spec: { replicas: 0 } }, { namespace: options.namespace });
                summary.logs.push(inspect(result, { colors: false, depth: 10 }));
            }
            
            const summaryLines: string[] = [];
            
            if (summary.pruned.length) {
                summaryLines.push('## Pruned deployments');
                summaryLines.push(...summary.pruned);
                summaryLines.push('');
            }
            
            if (summary.stillValid.length) {
                summaryLines.push('## Remaining deployments');
                summaryLines.push(...summary.stillValid);
                summaryLines.push('');
            }
            
            if (summary.logs.length) {
                summaryLines.push('### Logs');
                summaryLines.push(codeBlock('shell', summary.logs.join('\n')));
            }
            
            if (!summaryLines.length) {
                summaryLines.push('No deployments to prune.');
            }
            
            await FS.appendFile(options.summaryFile, summaryLines.join('\n'))
        }
    })
];

class DeletionAnnotation {
    public readonly timestamp: number;
    public readonly duration: string;
    public readonly distanceToNow: {
        delete: string;
        hibernate: string;
    };
    public readonly date: {
        delete: string;
        hibernate: string;
    }
    protected readonly deleteAt: Date;
    protected readonly hibernateAt: Date;
    
    constructor(config: Pick<DeletionAnnotation, 'timestamp' | 'duration'>) {
        this.timestamp = config.timestamp;
        this.duration = config.duration;
        this.deleteAt = addDays(this.timestamp, 365 * 3);
        this.hibernateAt = new Date(this.timestamp);
        this.distanceToNow = {
            hibernate: formatDistanceToNow(this.timestamp, { addSuffix: true, }),
            delete: formatDistanceToNow(this.deleteAt, { addSuffix: true }),
        };
        this.date = {
            delete: format(this.deleteAt, 'PPpp'),
            hibernate: format(this.timestamp, 'PPpp'),
        };
    }
    
    public get shouldDelete() {
        return isPast(this.deleteAt);
    }
    
    public get shouldHibernate() {
        if (this.shouldDelete) {
            return false;
        }
        return isPast(this.hibernateAt);
    }
    
    public toJSON() {
        return JSON.stringify({
            timestamp: this.timestamp,
            duration: this.duration,
        });
    }
    
    public static fromJSON(json: string) {
        const { timestamp, duration } = JSON.parse(json);
        return new DeletionAnnotation({ timestamp, duration });
    }
    
    public static fromManifest(manifest: KubeResource) {
        const annotation = manifest.metadata?.annotations?.['toolkit.meteor-vite.io/delete-at'];
        
        if (!annotation) {
            return new this({ timestamp: 0, duration: '0s' });
        }
        
        return this.fromJSON(annotation);
    }
    
    public static create(duration: string) {
        return new this({
            timestamp: Date.now() + parseDuration(duration),
            duration,
        });
    }
}

const gh = new class GithubCli {
    public async prComment(id: string, body: string) {
        return await execa('gh', [
            'pr',
            'comment',
            '--edit-last',
            '--create-if-none',
            '--repo',
            process.env.GITHUB_REPOSITORY!,
            '--body',
            body,
            id,
        ])
    }
    
    protected async getPrComments(id: string, user = 'github-actions') {
        const result = await execa('gh', [
            'pr',
            'view',
            '--json',
            'comments',
            '--repo',
            process.env.GITHUB_REPOSITORY!,
            id,
        ]);
        
        const json: PrViewCommentsResult = JSON.parse(result.stdout);
        
        console.log('Retrieved comments:', inspect(json, { colors: true, depth: 10}));
        
        return json.comments.filter((comment) => {
            return comment.author.login === user;
        });
    }
    
    public async patchPrComment(id: string, line: string) {
        const comments = await this.getPrComments(id);
        const lines: string[] = [];
        comments[0]?.body.split('\n').forEach((commentLine: string) => {
            if (commentLine.includes(line)) {
                return;
            }
            lines.push(commentLine);
        });
        lines.push(line);
        const body = lines.join('\n');
        await this.prComment(id, body);
    }
}

type PrViewCommentsResult = {
    comments: PrCommentJson[]
}

type PrCommentJson = {
    "id": string;
    "author": {
        "login": string;
    },
    "authorAssociation": string;
    "body": string;
    "createdAt": string;
    "includesCreatedEdit": boolean,
    "isMinimized": boolean,
    "minimizedReason": string;
    "reactionGroups": [],
    "url": string;
    "viewerDidAuthor": boolean
}

function parseDuration(duration: string): number {
    const durationMap = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
        y: 365 * 24 * 60 * 60 * 1000,
    }
    
    const [_, count, unit] = duration.match(/(\d+)([a-z]+)/i) || [];
    
    if (!(unit in durationMap)) {
        throw new Error(`Invalid duration unit: ${duration}. Should be in the format of 10s, 1m, 1h, 1d, 1w, 1y`);
    }
    
    if (!count) {
        throw new Error(`Could not parse duration number: ${duration}. Try 10s`);
    }
    
    return parseInt(count) * durationMap[unit as keyof typeof durationMap];
}

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

function summary(summary: { title: string, content: string, url: string }) {
    return `
Deployed to ${summary.url}
<details>
<summary>${summary.title}</summary>

${summary.content}
</details>
`;
}
