import { buildIfChanged } from '../has-changes';

const [_nodePath, _scriptPath, rootDir] = process.argv;

console.log({ rootDir });

buildIfChanged(rootDir).catch((error) => {
    console.error(error);
    process.exit(1);
});