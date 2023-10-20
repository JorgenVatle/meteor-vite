import {
    ArrayExpression,
    AssignmentExpression,
    CallExpression,
    FunctionExpression,
    Identifier,
    MemberExpression, NumericLiteral,
    ObjectExpression,
    ObjectProperty,
    StringLiteral,
} from '@babel/types';

type KnownObjectProperty<TValue extends Pick<ObjectProperty, 'key' | 'value'>> = Omit<ObjectProperty, 'key' | 'value'> & TValue;
type KnownObjectExpression<TValue extends Pick<ObjectExpression, 'properties'>> = Omit<ObjectExpression, 'properties'> & TValue;
type ModuleMethodCall<
    MethodName extends ModuleMethodName,
    Arguments extends CallExpression['arguments']
> = Omit<CallExpression, 'callee' | 'arguments'> & {
    callee: MemberExpression & {
        object: Identifier;
        property: Omit<Identifier, 'name'> & { name: MethodName };
    }
    arguments: Arguments
}
type KnownStringLiteral<Value extends string> = Omit<StringLiteral, 'value'> & { value: Value };
type KnownIdentifier<Name extends string> = Omit<Identifier, 'name'> & { name: Name };
type KnownObjectKey<Value extends string> = KnownStringLiteral<Value> | KnownIdentifier<Value>;

export namespace ModuleMethod {
    /**
     * Meteor's `module.link()` method, exposed internally for built Meteor packages.
     *
     * @example package source
     * export { default } from 'meteor/ostrio:cookies';
     * export * from 'meteor/tracker;
     *
     * @example bundle result
     * module.link('meteor/ostrio:cookies', {
     *     default: 'Cookies'
     * }, 0)
     * module1.link("meteor/tracker", {
     *     "*": "*"
     * }, 1);
     */
    export type Link = ModuleMethodCall<'link', [
        importPath: StringLiteral, // Hopefully only StringLiteral is all that can be here.
        exports: ObjectExpression,
        id: NumericLiteral
    ] | [importPath: StringLiteral]>;

    /**
     * Meteor's `module.exportDefault()` method - seems to only be used for modules that are lazy-loaded?
     * {@link https://github.com/JorgenVatle/meteor-vite/blob/71a1ed5b84439c02f5592bef1d4cf3ae565fa879/npm-packages/meteor-vite/test/__mocks/meteor-bundle/test_ts-modules.js#L42}
     *
     * @example Package source
     * export default namedFunction() {
     *     return 'foo';
     * }
     * @example Bundle result
     * module1.exportDefault(namedFunction);
     */
    export type ExportDefault = ModuleMethodCall<'exportDefault', [
        CallExpression['arguments'][number], // Can be anything, see ts_modules mock for example
    ]>

    /**
     * Meteor's `module.export({ ... })` method. This is essentially ES exports
     *
     * @example Package source
     * export const Foo = 'bar'
     * export default class FooBar {}
     *
     * @example Bundle result
     * module.export({
     *     Foo: () => Foo
     *    FooBar: () => FooBar
     * })
     */
    export type Export = ModuleMethodCall<'export', [
        ObjectExpression, // todo: Narrow this type further for keys and values (key Identifier/StringLiteral, etc.)
    ]>
    
    /**
     * Meteor's `module.runSetters()` method.
     * Todo: Add further documentation
     *
     * @example Bundle result
     * let current_component;
     * function set_current_component(component) {
     *   module.runSetters(current_component = component, ["current_component"]);
     * }
     */
    export type RunSetters = ModuleMethodCall<'runSetters', [
        AssignmentExpression, // todo: Verify whether this is the correct type to use here.
        ArrayExpression, // Todo: Narrow down expected array element types. (type: [string])
    ]>
    
    /**
     * Meteor's `module.runModuleSetters()` method.
     * Todo: Document use of this method.
     * Todo: Add expected argument types.
     */
    export type RunModuleSetters = ModuleMethodCall<'runModuleSetters', []>

    export type MethodMap = {
        export: Export;
        link: Link;
        exportDefault: ExportDefault;
        runSetters: RunSetters;
        runModuleSetters: RunModuleSetters,
    }

    /**
     * Any of the above methods, just that the arguments could be anything at this point.
     * Assists with the parser's `isMethod()` utility.
     */
    export type WithoutArgs<MethodName extends ModuleMethodName> = Omit<MethodMap[MethodName], 'arguments'> & Pick<CallExpression, 'arguments'>
}

export type MeteorPackageProperty = KnownObjectProperty<{
    key: StringLiteral, // File name
    value: FunctionExpression | MeteorNestedPackageProperty, // Module function
}>
type MeteorNestedPackageProperty = KnownObjectExpression<{
    properties: MeteorPackageProperty[]
}>

export const KnownModuleMethodNames = ['export', 'link', 'exportDefault', 'runSetters', 'runModuleSetters'] as const;
export type ModuleMethodName = typeof KnownModuleMethodNames[number];

/**
 * First argument of Meteor's `meteorInstall()` function for its packages.
 * This is an internal method that isn't used by package authors.
 *
 * @example start of the meteorInstall call
 *     {@link https://github.com/JorgenVatle/meteor-vite/blob/85120ec60beccca956c65880e94bce99b338f24e/npm-packages/meteor-vite/test/__mocks/meteor-bundle/rdb_svelte-meteor-data.js#L25 see mock example} var require = meteorInstall({"node_modules":{"meteor":{"rdb:svelte-meteor-data":{"index.js":function module(require,exports,module){
 * // ... build package code starts here
 */
export type MeteorInstallObject = KnownObjectExpression<{
    properties: [KnownObjectProperty<{
        key: KnownObjectKey<'node_modules'>
        value: KnownObjectExpression<{
            properties: [KnownObjectProperty<{
                key: KnownObjectKey<'meteor'>,
                value: KnownObjectExpression<{
                    properties: [KnownObjectProperty<{
                        key: KnownObjectKey<string>, // Package name
                        value: KnownObjectExpression<{
                            properties: MeteorPackageProperty[]
                        }>
                    }>]
                }>
            }>]
        }>
    }>]
}>

/**
 * A call expression for the `meteorInstall()` function.
 * We're using this to nicely cast types for meteorInstall() nodes.
 */
export type MeteorInstallCallExpression = Omit<CallExpression, 'arguments'> & { arguments: [MeteorInstallObject] }