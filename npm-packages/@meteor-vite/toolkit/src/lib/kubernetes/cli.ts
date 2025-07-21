import type { KubeResourceList } from '@/lib/kubernetes/types/Generic';
import type { KubeResource, KubeResourceType } from '@/lib/kubernetes/types/ResourceTypes';
import { execa } from 'execa';
import pc from 'picocolors';
import type { DeepPartial } from '~/meteor-vite/internals/lib/UtilityTypes';
import { envOverride } from '~/meteor-vite/utilities/server/EnvFlag';

type Verb = 'get' | 'patch' | 'create' | 'delete' | 'apply' | 'rollout';
const DRY_RUN = !!JSON.parse(envOverride('DRY_RUN', 'false'));

class KubectlCli {
    protected async kubectl<
        TType extends KubeResourceType,
        TResource = KubeResource<TType>
    >(verb: Verb, params: string[], options: UniversalOptions, stdin?: string): Promise<KubeResourceList<TResource> | TResource> {
        const args: string[] = [...params || []];
        const formatAsJson = !['rollout'].includes(verb);
        
        if (options.namespace) {
            args.push('-n', options.namespace);
        }
        
        options.labels?.forEach((selector) => {
            args.push('-l', selector.join(''))
        });
        
        if (DRY_RUN && !['get', 'rollout'].includes(verb)) {
            args.push('--dry-run=server');
        }
        
        if (formatAsJson) {
            args.push( '-o', 'json');
        }
        
        const result = await execa('kubectl', [verb, ...args], {
            input: stdin,
        }).catch((error: unknown) => {
            echoCommand(error);
            throw error;
        });
        
        echoCommand(result);
        
        if (formatAsJson) {
            return JSON.parse(result.stdout);
        }
        
        // @ts-expect-error Unused plain text output
        return result.stdout;
    }
    
    public get<TType extends KubeResourceType>(resource: TType, options: Omit<CommandOptions, 'name'>): Promise<KubeResourceList<KubeResource<TType>>>
    public get<TType extends KubeResourceType>(resource: TType, options: { name: string } & Omit<CommandOptions, 'name'>): Promise<KubeResource<TType>>
    public get<TType extends KubeResourceType>(resource: TType, options: CommandOptions): Promise<KubeResourceList<KubeResource<TType>> | KubeResource<TType>> {
        const args: string[] = [...options.params || []];
        if (options.name) {
            args.unshift(options.name);
        }
        
        return this.kubectl('get', [resource, ...args], options);
    }
    
    public apply(manifest: KubeResource, options: CommandOptions): Promise<unknown> {
        return this.kubectl('apply', ['-f', '-'], options, JSON.stringify(manifest));
    }
    
    public waitForDeploymentSuccess(deployment: string, timeout: string, options: UniversalOptions): Promise<unknown> {
        return this.kubectl('rollout', ['status', 'deployment', deployment, '--watch', '--timeout', timeout], options);
    }
    
    public delete(resource: KubeResourceType[], name: string, options: UniversalOptions): Promise<unknown> {
        return this.kubectl('delete', [resource.join(','), name], options);
    }
    
    public patch<TType extends KubeResourceType>(
        resource: TType,
        name: string,
        patch: DeepPartial<KubeResource<TType>>,
        options: UniversalOptions
    ): Promise<unknown> {
        return this.kubectl('patch', [resource, name, '-p', JSON.stringify(patch)], options);
    }
}

function echoCommand(result: unknown) {
    if (!result) {
        return;
    }
    if (typeof result !== 'object') {
        return;
    }
    if (!('command' in result) || typeof result.command !== 'string') {
        return;
    }
    console.log(pc.dim([pc.bold('$'), pc.cyan(result.command)].join(' ')));
}

interface UniversalOptions {
    labels?: LabelSelector[];
    namespace: string;
}

type LabelOperator = '=' | '!=' | '==';

type LabelSelector = [string, LabelOperator, string];

interface CommandOptions extends UniversalOptions {
    name?: string;
    params?: string[];
}

export const kubectl = new KubectlCli();