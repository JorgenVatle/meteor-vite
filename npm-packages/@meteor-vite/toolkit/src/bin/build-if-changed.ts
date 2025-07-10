import { buildIfChanged } from '../Changes';
import { parseCliParams } from '../lib/parseCliParams';

const { rootDir } = parseCliParams();

buildIfChanged(rootDir).catch((error) => {
    console.error(error);
    process.exit(1);
});