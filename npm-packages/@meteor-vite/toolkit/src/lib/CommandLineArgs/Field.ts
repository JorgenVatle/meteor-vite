import type TsCliArgs from 'ts-command-line-args';

export type Field<T = any> = OptionalField<T> | MultiField<T> | BaseField<T> | OptionalMultiField<T>;

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
    },
};

export type InferFieldType<
    TField,
> = TField extends OptionalMultiField<infer T>
    ? T[] | undefined
    : TField extends OptionalField<infer T>
      ? T | undefined
      : TField extends MultiField<infer T>
        ? T[]
        : TField extends BaseField<infer T>
          ? T
          : never;

export type FieldConfig<TField extends Field = Field> = TField & BasePropertyOptions

type BasePropertyOptions = Omit<TsCliArgs.PropertyOptions<any>, 'type' | 'multiple' | 'optional' | 'defaultValue'>

interface PropertyOptions<TField> extends BasePropertyOptions {
    defaultValue?: InferFieldType<TField>;
}