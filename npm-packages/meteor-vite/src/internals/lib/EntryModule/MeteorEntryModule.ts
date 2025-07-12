import { EntryModuleBase, type EntryModuleConfig } from '@/internals/lib/EntryModule/EntryModuleBase';
import { documentationLink } from '@/utilities/common';
import { Colorize, formatLogBlock } from '@/utilities/server';

export class MeteorEntryModule extends EntryModuleBase {
    constructor(
        public readonly path: string,
        public readonly config: MeteorModuleConfig,
    ) {
        super(path);
    }
    
    protected _write(content: string) {
        const arch = Colorize.arch(this.config.context);
        this.logger.warn(
            formatLogBlock(
                `Meteor-Vite needs to write to your Meteor ${arch}'s main module defined in your package.json`,
                [
                    `If you've migrated an existing project, please make sure to move any existing code`,
                    `in this file over to the entry module specified in your Vite config.`,
                    '\n',
                    `More info: ${documentationLink('lazy-loaded-meteor-packages')}`
                ])
        );
        return super._write(content);
    }
}

interface MeteorModuleConfig extends EntryModuleConfig {
    context: 'server' | 'client';
}