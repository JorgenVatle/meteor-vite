import { Commands } from '@/Commands';
import { CommandFailure } from '@/errors/CommandFailure';
import { parseCliParams } from '@/lib/parseCliParams';
import * as process from 'node:process';

try {
    const { command, options } = parseCliParams();
    
    await Commands.run(command, options);
} catch (error) {
    if (error instanceof CommandFailure) {
        console.error(error.message);
        process.exit(1);
    }
    throw error;
}