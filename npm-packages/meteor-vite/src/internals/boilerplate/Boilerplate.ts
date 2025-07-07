import type { Arch } from '@/utilities/server';

export type Boilerplate = {
    dynamicHead?: string;
    dynamicBody?: string;
}
export abstract class ViteBoilerplate {
    public abstract getBoilerplate(arch: Arch):  Boilerplate;
}