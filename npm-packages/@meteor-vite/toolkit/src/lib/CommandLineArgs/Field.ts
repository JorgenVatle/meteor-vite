import type TsCliArgs from 'ts-command-line-args';

export type Field<T = any> = OptionalField<T> | MultiField<T> | BaseField<T>;

export type OptionalField<T = any> = {
    optional: true;
} & BaseField<T>;

export type OptionalMultiField<T = any> = {
    optional: true;
} & MultiField<T>;

export type MultiField<T = any> = {
    multiple: true;
} & BaseField<T>;

export type BaseField<T = any> = {
    type: {
        (value?: any): T;
    }
} & PropertyOptions<T>;


type BasePropertyOptions = Omit<TsCliArgs.PropertyOptions<any>, 'type' | 'multiple' | 'optional' | 'defaultValue'>

interface PropertyOptions<T = any> extends BasePropertyOptions {
    defaultValue?: T;
}