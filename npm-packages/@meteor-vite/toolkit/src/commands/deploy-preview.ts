import { CommandDefinition } from '@/lib/CommandDefinition';
import FS from 'fs/promises';
import { execSync, spawn } from 'node:child_process';
import { inspect } from 'node:util';
import { parse } from 'yaml';

export default [
    new CommandDefinition('kube-deploy', {
        title: 'Deploy a preview to Kubernetes',
        description: 'Creates a temporary deployment to a Kubernetes cluster for previewing changes from pull requests or branches.',
        fields: {
            'git-ref': {
                type: String,
                description: 'Branch or pull request ID. Uniquely identifies the deployment. Will be inferred from the current environment.',
                defaultValue: process.env.GITHUB_REF_NAME,
            },
            namespace: {
                type: String,
                description: 'Kubernetes namespace to deploy to',
                defaultValue: process.env.KUBE_NAMESPACE,
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
                defaultValue: process.env.APP_VERSION || (process.env.GITHUB_SHA && `sha-${process.env.GITHUB_SHA?.slice(0, 7)}`),
            },
        },
        handler: async (options) => {
            const manifestInput = FS.readFile(options.manifest, 'base64');
            
            const substitutedManifest = parse(execSync(`echo '${manifestInput}' | base64 -d -w 0 | envsubst`, {
                env: {
                    KUBE_NAMESPACE: options.namespace,
                    GIT_REF: options['git-ref'],
                    DOCKER_IMAGE: options.image,
                    APP_VERSION: options.version,
                    ...process.env,
                }
            }).toString('utf8'));
            
            await FS.appendFile(process.env.GITHUB_STEP_SUMMARY!, summary('Deployment manifest', codeBlock('yaml', substitutedManifest)))
            
            await sh(['echo', substitutedManifest, '|', 'kubectl', 'apply', '-f', '-']);
            
            console.log(inspect(substitutedManifest, { colors: true, depth: 10 }));
        }
    })
]

async function sh([command, ...params]: string[]) {
    return spawn(command, params, {
        stdio: 'inherit',
    });
}

async function kubectl(params: string[]) {
    return execSync(`kubectl ${params.join(' ')}`, {
        stdio: 'inherit',
    });
}

function codeBlock(language: string, content: string) {
    return [
        '```' + language,
        content,
        '```'
    ].join('\n')
}

function summary(title: string, content: string) {
    return `
<details>
<summary>${title}</summary>

${content}
</details>
`
}
