import { MeteorViteError } from '@/internals/error/MeteorViteError';
import { EntryModuleBase, type EntryModuleConfig } from '@/internals/lib/EntryModule/EntryModuleBase';
import { bugs } from '@/utilities/common/Constants';

export class ViteEntryModule extends EntryModuleBase {
    public readonly config: EntryModuleConfig = {
        location: 'app-source',
    };
    
    protected _write() {
        throw new MeteorViteError('Tried to write to a Vite entry module.', {
            subtitle: [
                `This should never happen and most likely is a bug in Meteor-Vite.`,
                `Please report this issue at ${bugs.url}.`
            ].join(' '),
        })
    }
}

export type ViteMainModule = {
    client: ViteEntryModule,
    server?: ViteEntryModule,
};