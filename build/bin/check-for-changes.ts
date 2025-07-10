import { parseCliParams } from '../CliParamParser';
import { checkChanges } from '../has-changes';

const { rootDir } = parseCliParams();

await checkChanges(rootDir, { detailedLogging: true });