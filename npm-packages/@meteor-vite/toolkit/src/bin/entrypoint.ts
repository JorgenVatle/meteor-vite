import { Commands } from '@/Commands';
import { CommandFailure } from '@/errors/CommandFailure';
import { parseCliParams } from '@/lib/parseCliParams';

const { command, options } = parseCliParams();

await Commands.run(command, options).catch((error) => {
    if (!(error instanceof CommandFailure)) {
        throw error;
    }
    
    process.exitCode = 1;
    console.error(error.message);
});