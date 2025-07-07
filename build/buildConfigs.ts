import type { Options } from 'tsup';

export async function buildConfigs(list: ConfigList[]) {
    const configs: Options[] = [];
    
    for (const config of list) {
        const awaited = await Promise.resolve(config).then((config) => {
            if ('default' in config) {
                return config.default;
            }
            return config;
        });
        
        if (Array.isArray(awaited)) {
            configs.push(...awaited);
            continue;
        }
        
        configs.push(awaited);
        
    }
    
    return configs;
}

type AsyncConfig = Promise<{ default: Options | Options[] }>;
type ConfigList = Options | AsyncConfig;