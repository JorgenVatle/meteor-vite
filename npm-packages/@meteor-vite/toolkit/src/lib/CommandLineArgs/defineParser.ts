import type { FieldConfig } from '@/lib/CommandLineArgs/Field';
import {
    parseArgs,
    type ParserOptions,
    type Pretty,
    type ResolveFieldInputTypes,
    type ResolveFieldTypes,
} from '@/lib/CommandLineArgs/parseArgs';
import type { Content } from 'ts-command-line-args/src/contracts';

export class Parser<
    TFields extends Record<string, FieldConfig> = Record<string, FieldConfig>,
    TOutput extends Pretty<ResolveFieldTypes<TFields>> = Pretty<ResolveFieldTypes<TFields>>,
    TInput extends Pretty<ResolveFieldInputTypes<TFields>> = Pretty<ResolveFieldInputTypes<TFields>>,
    TOptions extends ParserInstanceOptions<TOutput> = ParserInstanceOptions<TOutput>,
    TTransform = TOutput,
> {
    declare _inputType: Pretty<TInput>;
    declare _outputType: Pretty<TOutput>;
    public readonly options: ParserInstanceOptions<TOutput>;
    protected readonly _transform?: (output: TOutput) => TTransform;
    
    constructor(
        public readonly fields: TFields,
        options?: ParserInstanceOptions<TOutput, TTransform>,
    ) {
        this.options = options || {} as TOptions;
        Object.assign(this.options, { helpArg: options?.helpArg || 'help' })
        this._transform = options?.transform;
    }
    
    public setHelpContent(content: HelpContent) {
        const options: ParserInstanceOptions<TOutput> = {
            headerContentSections: [
                { header: content.title, content: content.description },
            ],
            footerContentSections: content.footer,
        }
        Object.assign(this.options, options);
    }
    
    public printHelp(header?: string, content?: Content[]) {
        this.parse({
            argv: [`--${this.options.helpArg?.toString() || 'help'}`],
            addOptionalDefaultExplanatoryFooter: true,
            footerContentSections: [
                ...this.options.footerContentSections || [],
                { header: header, content: content },
            ],
        })
    }
    
    public parse(options?: ParserInstanceOptions<TOutput>): TOutput {
        const defaults = {
            ...this.options?.defaults,
            ...options?.defaults,
        };
        return parseArgs(this.fields, {
            ...this.options,
            ...options,
            // @ts-expect-error
            defaults,
        });
    }
    
    public transform(options?: TOptions): TTransform {
        const output = this.parse(options);
        if (!this._transform) {
            return output as any;
        }
        return this._transform(output);
    }
}

export type ParserInstanceOptions<TOutput, TTransform = unknown> = ParserOptions<TOutput> & {
    transform?: (output: TOutput) => TTransform;
}

export type HelpContent = {
    title: string;
    description: string;
    footer?: Content[];
}