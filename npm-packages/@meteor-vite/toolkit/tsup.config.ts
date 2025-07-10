import { defineBuildConfig } from '@/defineBuildConfig';

export default defineBuildConfig(import.meta.dirname, {
    name: '@meteor-vite/toolkit/bin',
    entry: ['src/bin'],
})