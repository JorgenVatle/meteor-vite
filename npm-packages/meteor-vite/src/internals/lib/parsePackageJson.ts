import { CurrentConfig } from '@/internals/lib/resolveMeteorViteConfig';

import type { ProjectJson } from '@/plugin';
import FS from 'fs';
import Path from 'path';

export function parsePackageJson(): ProjectJson {
    const { projectRoot } = CurrentConfig;
    const path = Path.join(projectRoot, 'package.json');
    
    if (!FS.existsSync(path)) {
        throw new Error(`⚡ Could not resolve package.json for your project: ${projectRoot}`);
    }
    
    return Object.assign({
        dependencies: {},
        devDependencies: {},
    }, JSON.parse(FS.readFileSync(path, 'utf8')));
}