import { execFileSync, execSync, spawn } from 'child_process';
import Path from 'path';
import FS from 'fs/promises';

// Assuming this is launched from the repository root for now.
const repoPath = process.cwd();
const PACKAGE_NAME_REGEX = /name:\s*'(?<packageName>(?<author>[\w\-._]+):(?<name>[\w\-._]+))'\s*,/;
const PACKAGE_VERSION_REGEX = /version:\s*'(?<version>[\d\w.+-]+)'\s*,/;
const CHANGESET_STATUS_FILE = 'changeset-status.json';
const meteorPackage = {
    name: 'jorgenvatle:vite',
    packageJsPath: Path.join(repoPath, './packages/vite/package.js'),
    packageJsonPath: Path.join(repoPath, './packages/vite/package.json'),
};
const logger = {
    _history: [],
    _log(level, params) {
        console[level].apply(this, params);
        this._history.push(params.join(' '));
    },
    info: (...params) => logger._log('info', params),
    error: (...params) => logger._log('error', params),
    emitSummary() {
        if (!process.env.GITHUB_STEP_SUMMARY) {
            return;
        }

        let summary = `\n### Release Meteor Package\n\n`;
        summary += '```\n';
        summary += this._history.join('\n');
        summary += '\n```\n';

        FS.appendFile(process.env.GITHUB_STEP_SUMMARY, summary, (error) => {
            if (!error) return;
            console.error(error);
        });
    },
}

async function parsePackageJs(packageJsPath) {
    logger.info(`⚡  Parsing ${Path.basename(Path.dirname(packageJsPath))} package.js file...`);
    logger.info(`  L ${packageJsPath}`);
    const rawContent = await FS.readFile(packageJsPath, 'utf-8');
    const name = rawContent.match(PACKAGE_NAME_REGEX)?.groups.packageName;
    const version = rawContent.match(PACKAGE_VERSION_REGEX)?.groups?.version;

    return {
        rawContent,
        name,
        version,
    }
}

async function parsePackageJson() {
    return JSON.parse(await FS.readFile(meteorPackage.packageJsonPath, 'utf-8'));
}

async function updateChangesetToUseMeteorPackageNameFormat() {
    const packageJson = await parsePackageJson();
    const CHANGESET_DIR = '.changeset';

    const formattedName = packageJson.name.replace('_', ':');

    // Rewrite changeset jorgenvatle_vite to jorgenvatle:vite
    const changesets = await FS.readdir('.changeset');
    for (const changeset of changesets) {
        if (!changeset.endsWith('.md')) {
            continue;
        }
        const path = Path.join(CHANGESET_DIR, changeset);
        const content = await FS.readFile(path, 'utf-8');
        const newContent = content.replace(packageJson.name, formattedName);
        await FS.writeFile(path, newContent);
    }

    // Rewrite package.json from jorgenvatle_vite to jorgenvatle:vite
    await FS.writeFile(meteorPackage.packageJsonPath, JSON.stringify({
        ...packageJson,
        name: formattedName,
    }, null, 2));
}

async function applyVersion() {
    await shell(`changeset status --output ${CHANGESET_STATUS_FILE}`);

    const { releases } = await FS.readFile(`${CHANGESET_STATUS_FILE}`, 'utf-8')
                                 .then((content) => JSON.parse(content));

    const release = releases.find(({ name }) => name === meteorPackage.name.replace(':', '_'));

    if (!release) {
        logger.info('⚠️  No pending releases found for %s', meteorPackage.name);
        return;
    }

    logger.info(`ℹ️  New version ${release.newVersion} for ${meteorPackage.name} detected`);

    await setVersion(release.newVersion);

    await shell(`rm ${CHANGESET_STATUS_FILE}`);
    await shell(`git add ${meteorPackage.packageJsPath}`);
    await shell(`git commit -m 'Bump ${meteorPackage.name} version to ${release.newVersion}'`);

    // Rewrite package.json and changelogs to use jorgenvatle:vite instead of jorgenvatle_vite
    await updateChangesetToUseMeteorPackageNameFormat();
    await shell('npx changeset version');
}

async function setVersion(newVersion) {
    const { rawContent, version, name } = await parsePackageJs(meteorPackage.packageJsPath);
    if (!version) {
        throw new Error(`Unable to read version from ${meteorPackage.name} package.js`);
    }
    const patchedPackageJs = rawContent.replace(PACKAGE_VERSION_REGEX, `version: '${newVersion}',`);
    await FS.writeFile(meteorPackage.packageJsPath, patchedPackageJs);

    logger.info(`✅  Changed ${meteorPackage.name} (${name}) version from v${version} to v${newVersion}\n`);
}

async function publish() {
    const { version } = await parsePackageJson();

    logger.info(`⚡  Publishing ${meteorPackage.name}...`);

    if (await isPublished(version)) {
        logger.info(`⚠️  Version ${version} is already published to Atmosphere. Skipping...`);
        return;
    }

    const release = execSync('meteor --version').toString().trim();
    logger.info(`✨  Publishing to Atmosphere with Meteor ${release} release...`);
    await setVersion(version);

    await shell(`meteor publish`, {
        async: true,
        cwd: Path.dirname(meteorPackage.packageJsPath),
        env: {
            METEOR_SESSION_FILE: process.env.METEOR_SESSION_FILE, // Authenticate using auth token stored as file.
            VITE_METEOR_DISABLED: 'true', // Prevents vite:bundler from trying to compile itself on publish
            ...process.env,
        },
    });

    logger.info(`🚀  Published to Atmosphere: `);
    logger.info(` L ${meteorPackage.name}@${version}`);

    // Ensures GitHub releases will use the correct Meteor package name format
    // jorgenvatle:vite instead of jorgenvatle_vite
    await updateChangesetToUseMeteorPackageNameFormat();
}

/**
 * Revert package.json files using Meteor package name format (author:name) to npm-compatible placeholder format
 * (author_name)
 * @returns {Promise<void>}
 */
async function fixPackageJsonName() {
    const packageJson = await parsePackageJson();
    if (!packageJson.name.includes(':')) {
        logger.info('🔎 No meteor package name format detected in package.json. No changes necessary!');
        return;
    }
    const meteorName = packageJson.name;
    logger.info(`⚠️ Detected package.json using Meteor package name format: ${packageJson.name.name}`);

    packageJson.name = packageJson.name.replace(':', '_');
    await FS.writeFile(meteorPackage.packageJsonPath, JSON.stringify(packageJson, null, 2));

    await shell(`git add ${meteorPackage.packageJsonPath}`);
    await shell(`git commit -m 'Revert ${meteorName} package.json name to use npm-compatible format' -m '[skip ci]'`);
    await shell(`git push`);

    logger.info(`✅  Fixed package.json name to use npm-compatible format: ${packageJson.name}`);
}

function shell(command, options) {
    logger.info(`$ ${command}`);
    if (!options?.async) {
        logger.info(execSync(command, { ...options, encoding: 'utf-8' }));
        return;
    }
    const [bin, ...args] = command.split(' ');
    const childProcess = spawn(bin, args, {
        ...options,
        stdio: 'inherit',
    });

    return new Promise((resolve, reject) => {
        childProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command "${command}" exited with code ${code}`));
            }
        });
    }).catch((error) => {
        throw new ShellError(error.message, { cause: error });
    })
}

/**
 * Retrieve all published versions of the package from Atmosphere.
 * @returns {Promise<{
 *  versions: {
 *   exports: unknown[];
 *   implies: unknown[];
 *   name: string;
 *   version: string;
 *   description: string;
 *   summary: string;
 *   git: string;
 *   publishedBy: string;
 *   publishedOn: {
 *     $date: number;
 *   };
 *   installed: boolean;
 *   architecturesOS: string[];
 *   deprecated: boolean;
 *  }[]
 *  name: string;
 *  maintainers: string[];
 *  totalVersions: number;
 * }>}
 */
async function getPublishedVersions() {
    const json = execFileSync('meteor', ['show', `${meteorPackage.name}`, '--show-all', '--ejson']).toString();
    return JSON.parse(json);
}

async function isPublished(version) {
    const { versions } = await getPublishedVersions();
    return versions.some((release) => release.version === version);
}

(async () => {
    const [binPath, modulePath, action] = process.argv;

    if (action === 'publish') {
        await publish();
        return;
    }

    if (action === 'version') {
        await applyVersion();
        return;
    }

    if (action === 'fix-package-name') {
        await fixPackageJsonName();
        return;
    }

    throw new Error(`The provided argument is not recognized: "${action}"`);

})().catch((error) => {
    const { stdout, stderr } = error;

    if (!error.code && !error.status) {
        logger.error(error);
    }

    // Error should already be printed to stdout
    if (error instanceof ShellError) {
        process.exit(1);
    }

    if (stdout) {
        logger.info(stdout.toString());
    }
    if (stderr) {
        logger.error(stderr.toString());
    }

    logger.emitSummary();
    process.exit(1);
}).finally(() => {
    logger.emitSummary();
});

class ShellError extends Error {
    constructor(message) {
        super(message);
    }
}