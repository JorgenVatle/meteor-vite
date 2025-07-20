import type { KubeResourceList } from '@/lib/kubernetes/types/Generic';
import type { KubeResource, KubeResourceType } from '@/lib/kubernetes/types/ResourceTypes';
import { execa } from 'execa';
import pc from 'picocolors';
import { envOverride } from '~/meteor-vite/utilities/server/EnvFlag';

type Verb = 'get' | 'patch' | 'create' | 'delete' | 'apply';
const DRY_RUN = !!JSON.parse(envOverride('DRY_RUN', 'true'));

class KubectlCli {
    protected async kubectl<
        TType extends KubeResourceType,
        TResource = KubeResource<TType>
    >(verb: Verb, params: string[], options: UniversalOptions): Promise<KubeResourceList<TResource> | TResource> {
        const args: string[] = [...params || []];
        
        if (options.namespace) {
            args.push('-n', options.namespace);
        }
        
        options.labels?.forEach((selector) => {
            args.push('-l', selector.join(''))
        });
        
        if (DRY_RUN && verb !== 'get') {
            args.push('--dry-run=server');
        }
        
        const result = await execa('kubectl', [verb, ...args, '-o', 'json']).catch((error: unknown) => {
            echoCommand(error);
            throw error;
        });
        
        echoCommand(result);
        
        return JSON.parse(result.stdout);
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
    
    public apply(manifest: KubeResource): Promise<unknown> {
        return this.kubectl('apply', ['-f', '-', JSON.stringify(manifest)], {});
    }
    
    public patch(resource: KubeResourceType, name: string, patch: KubeResource, options: UniversalOptions): Promise<unknown> {
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
    namespace?: string;
}

type LabelOperator = '=' | '!=' | '==';

type LabelSelector = [string, LabelOperator, string];

interface CommandOptions extends UniversalOptions {
    name?: string;
    params?: string[];
}

export const kubectl = new KubectlCli();