import projectCompiler from '@/commands/project-compiler';
import { CommandList } from '@/lib/CommandList';

export const Commands = new CommandList({
    ...projectCompiler,
})