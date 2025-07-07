import MeteorPackage from '@/plugin/meteor/package/components/MeteorPackage';
import ViteLoadRequest, { RequestContext } from '@/plugin/ViteLoadRequest';
import { bugs } from '@/utilities';
import pc from 'picocolors';
import { inspect } from 'util';

const divColor = (text: string) => pc.dim(text);

export class MeteorViteError extends Error implements ErrorMetadata {
    public package: ErrorMetadata['package'];
    public context: ErrorMetadata['context'];
    public cause: ErrorMetadata['cause'];
    public subtitle?: ErrorMetadata['subtitle'];
    protected metadataLines: string[] = [];
    
    constructor(public originalMessage?: string, { cause, context, package: meteorPackage, subtitle }: ErrorMetadata = {}) {
        super(originalMessage);
        this.subtitle = subtitle
        this.cause = cause;
        this.context = context;
        this.package = meteorPackage;
        
        if (cause instanceof Error && !subtitle) {
            this.subtitle = `Caused by [${cause?.name}] ${cause?.message}`
        }
        if (cause) {
            this.addSection('Caused by', cause);
        }
    }
    
    protected addLine(...lines: string[] | [string[]]) {
        if (Array.isArray(lines[0])) {
            lines = lines[0];
        }
        const whitespace = '  '
        this.metadataLines.push(`${whitespace}${lines.join(whitespace)}`);
    }
    
    public setContext(loadRequest: ViteLoadRequest) {
        this.context = loadRequest.context;
    }
    
    protected async formatLog() {
        // Used for errors that extend MeteorViteError to add additional data to the error's stack trace.
    }
    
    protected addSection(title: string, object: any) {
        const content = inspect(object, { colors: true });
        const divider = this.titleDivider({
            title: `[${title}]`,
            indent: 2,
        })
        this.addLine(divider);
        content.split(/[\r\n]+/).forEach((line) => {
            this.addLine(`${divColor('|')}  ${line}`)
        })
    }
    
    protected titleDivider({
       title = '',
       addLength = 0,
       divider = '-',
       indent = 0
   }) {
        divider = divColor(divider);
        let repeatCount = 85 - title.length + addLength - indent;
        if (repeatCount < 1) {
            return title;
        }
        return `${divider.repeat(indent)}${title}${divider.repeat(repeatCount)}`
    }
    
    public async beautify() {
        await this.formatLog();
        
        const moduleId = this.context?.id.replace('meteor/', '') || this.package?.packageId;
        const moduleString = moduleId && pc.yellow(`\n⚡   <${moduleId}>`) || '';
        this.name = `\n\n${this.titleDivider({
            title: `[${this.constructor.name}]`,
            divider: '_',
            indent: 6,
        })}${moduleString}`;
        
        this.message = [
            '',
            '',
            `${pc.bgRed(pc.bold(' ERROR '))} ${this.message}`,
            `${pc.dim(this.subtitle)}`,
            '',
            ...this.metadataLines!,
            this.titleDivider({
                title: '[Error Stack]',
                indent: 2,
            }),
        ].filter((line, index) => {
            if (typeof line !== 'string') {
                return false;
            }
            if (index === 1 && !this.subtitle) { // Filter out subtitle
                return false;
            }
            return true;
        }).join('\n');
        
        const endOfLog = this.titleDivider({ divider: '_' })
        const reportIssue = ` 🐛  Report an issue:\n  -  ${bugs.url}`
        this.stack = `${this.stack}\n\n${reportIssue}\n${endOfLog}\n`;
        
        if (!this.cause) {
            this.clearProperties(['cause'])
        }
        
        this.clearProperties([
            'subtitle',
            'originalMessage',
            'package',
            'context',
            'metadataLines',
        ])
    }
    
    protected clearProperties(keys: (keyof ErrorMetadata | keyof MeteorViteError | 'metadataLines')[]) {
        keys.forEach((key) => delete this[key]);
    }
}

export class FatalMeteorViteError extends MeteorViteError {}

export interface ErrorMetadata {
    subtitle?: string;
    package?: Pick<MeteorPackage, 'packageId'>;
    context?: Pick<RequestContext, 'id'>;
    cause?: Error | unknown;
}