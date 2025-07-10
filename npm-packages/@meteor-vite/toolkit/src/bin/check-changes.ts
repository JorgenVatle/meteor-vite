import { checkChanges } from '../Changes';
import { parseCliParams } from '../lib/parseCliParams';

const { rootDir } = parseCliParams();

await checkChanges(rootDir, { detailedLogging: true });