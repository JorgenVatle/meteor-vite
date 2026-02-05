import { Parser } from '@/lib/CommandLineArgs/defineParser';
import { debugEnabled } from '~/meteor-vite/utilities/server/EnvFlag';

class ConfigStore {
    public debug = false;
    public readonly parser;
    constructor() {
        this.parser =  new Parser({
            debug: {
                type: Boolean,
                description: 'Enable debug logging',
                defaultValue: debugEnabled('toolkit'),
                typeLabel: 'true|false',
                global: true,
            },
        }, {
            partial: true,
        });
        
        Object.assign(this, this.parser.parse({
            partial: true,
        }));
    }
}

export const GlobalConfig = new ConfigStore();