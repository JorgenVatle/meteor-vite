export function defineIpcMethods<TMethods extends {
    [key in string]: (...params: any) => Promise<void> | void;
}>(methods: TMethods): TMethods {
    return methods;
}