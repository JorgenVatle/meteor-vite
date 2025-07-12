import { EntryModuleBase } from '@/internals/lib/EntryModule/EntryModuleBase';
import FS from 'node:fs';

export class InternalEntryModule extends EntryModuleBase {
    public clean() {
        try {
            FS.rmSync(this.dirname, { recursive: true, force: true });
        } catch (error: any) {
            // Probably safe to ignore
            console.warn(`Failed to clean: ${error.message}`);
        } finally {
            this.prepare();
        }
    }
    
    public write() {
        this._write(this.importLines);
        this.logger.debug('Saved entry module', {
            entryModule: this.path,
        })
    }
}

export type InternalMainModule = {
    client: InternalEntryModule;
    server: InternalEntryModule;
}