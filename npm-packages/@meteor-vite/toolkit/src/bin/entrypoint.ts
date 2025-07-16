import { Commands } from '@/commands';
import { CommandFailure } from '@/errors/CommandFailure';

await Commands.runWithParser().catch((error) => {
    console.log(error);
    if (!(error instanceof CommandFailure)) {
        throw error;
    }
    
    process.exitCode = 1;
    console.error(error.message);
});