import FS from 'node:fs';
import Path from 'node:path';

export function writeToPathSync(path: string, content: string) {
    FS.mkdirSync(Path.dirname(path), { recursive: true });
    FS.writeFileSync(path, content);
}