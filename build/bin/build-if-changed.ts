import { parseCliParams } from '../CliParamParser';
import { buildIfChanged } from '../has-changes';

const { rootDir } = parseCliParams();

buildIfChanged(rootDir).catch((error) => {
    console.error(error);
    process.exit(1);
});