import { buildConfigs } from './build/buildConfigs';

export default buildConfigs([
    await import('./packages/vite/tsup.config'),
    await import('./npm-packages/meteor-vite/tsup.config')
])