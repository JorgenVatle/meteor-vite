import deployPreview from '@/commands/deploy-preview';
import projectCompiler from '@/commands/project-compiler';
import rewriteFileUrls from '@/commands/rewrite-file-urls';
import { CommandList } from '@/lib/CommandList';

export const Commands = new CommandList([
    ...projectCompiler,
    ...rewriteFileUrls,
    ...deployPreview,
])