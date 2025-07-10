import { Changes } from '@/Changes';
import { parseCliParams } from '@/lib/parseCliParams';

const { rootDir } = parseCliParams();

await new Changes(rootDir).buildIfChanged();
