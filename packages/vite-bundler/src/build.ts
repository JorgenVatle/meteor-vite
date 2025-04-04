import fs from 'fs-extra';
import pc from 'picocolors';
import path from 'node:path';
import Logger from './utility/Logger';
import Semver from 'semver';
import Compiler, { BUNDLE_FILE_EXTENSION } from './plugin/Compiler';
import { Meteor } from 'meteor/meteor';
import { prepareViteBundle, ViteBundleOutput } from './plugin/IntermediaryMeteorProject';
import { getBuildConfig } from './utility/Helpers';
import { getProjectPackageJson } from './workers';

const {
  isSimulatedProduction,
  viteOutSrcDir,
  pluginEnabled,
} = getBuildConfig();

// Empty stubs from any previous builds
if (pluginEnabled) {
  validateNpmDependencies();
  fs.ensureDirSync(viteOutSrcDir);
  fs.writeFileSync(path.join(path.dirname(viteOutSrcDir), '.gitignore'), '*');
  fs.writeFileSync(
      path.join(viteOutSrcDir, `meteor-entry.js.${BUNDLE_FILE_EXTENSION}`),
      `// Stub file for Meteor-Vite\n`, 'utf8'
  );
}

if (!pluginEnabled) {
  Logger.info('Build plugin is disabled')
}

// In development, clients will connect to the Vite development server directly. So there is no need for Meteor
// to do any work.
else if (process.env.NODE_ENV === 'production') {
  const bundle = build();
  
  try {
    // Meteor v3 build process (Async-await)
    if (Meteor.isFibersDisabled) {
      Plugin.registerCompiler({
        extensions: [BUNDLE_FILE_EXTENSION],
        filenames: [],
      }, () => bundle.then(() => new Compiler()));
      
      await bundle;
    }
    
    // Meteor v2 build process (Fibers)
    else {
      Promise.await(bundle);
      Plugin.registerCompiler({
        extensions: [BUNDLE_FILE_EXTENSION],
        filenames: [],
      }, () => new Compiler());
    }
    
    Logger.success('Build completed');
  } catch (error) {
    Logger.error(' Failed to complete build process:\n', error);
    throw error;
  }
}

async function build() {
  const { payload } = await prepareViteBundle();
  
  // Transpile and push the Vite bundle into the Meteor project's source directory
  copyViteBundle({ payload });
  
  Compiler.addCleanupHandler(() => {
    if (isSimulatedProduction) return;
    fs.removeSync(viteOutSrcDir);
  });
}


function copyViteBundle({ payload }: Pick<ViteBundleOutput, 'payload'>) {
  const profile = Logger.startProfiler();
  Logger.info('Copying Vite bundle into Meteor assets...');
  
  fs.ensureDirSync(viteOutSrcDir)
  fs.emptyDirSync(viteOutSrcDir)
  
  // Add .gitignore file to prevent the transpiled bundle from being committed accidentally.
  fs.writeFileSync(path.join(viteOutSrcDir, '.gitignore'), '/**');
  
  for (const { fileName: file } of payload.output) {
    const from = path.join(payload.outDir, file)
    const to = path.join(viteOutSrcDir, `${file}.${BUNDLE_FILE_EXTENSION}`);
    fs.ensureDirSync(path.dirname(to))
    fs.copyFileSync(from, to)
  }
  
  profile.complete('Assets copied successfully');
}

function validateNpmDependencies() {
  const MIN_METEOR_VITE_NPM_VERSION = '2.0.0';
  const MIN_METEOR_VITE_NPM_VERSION_RANGE = `^${MIN_METEOR_VITE_NPM_VERSION}`;
  const packageJson = getProjectPackageJson();
  const packageLock = getProjectPackageJson('package-lock.json');
  const dependencies = packageLock.packages || packageLock.dependencies || {};
  
  // Check that the minimum compatible version of meteor-vite is installed.
  function meteorVite() {
    const version = dependencies['meteor-vite']?.version || dependencies['node_modules/meteor-vite']?.version;
    const minVersion = Semver.parse(MIN_METEOR_VITE_NPM_VERSION)
    
    if (!minVersion) {
      console.error(new Error('⚡  Unable to determine minimum required version of meteor-vite'));
      return;
    }
    
    const installCommand = pc.yellow(`${pc.dim('$')} meteor npm i meteor-vite@${minVersion.major}.${minVersion.minor}`);
    
    if (!version) {
      console.error([
        `⚡  Missing ${pc.cyan('meteor-vite')} in your dependencies!`,
        `   Please install it: ${installCommand}`,
      ].join('\n'))
      return;
    }
    
    if (Semver.satisfies(version, MIN_METEOR_VITE_NPM_VERSION_RANGE)) {
      return;
    }
    
    
    console.error([
      `⚡  You are using ${pc.cyan(`meteor-vite v${version}`)} which is not supported by the currently installed version of ${pc.cyan('jorgenvatle:vite-bundler')}`,
      `   Please update it: ${installCommand}`
    ].join('\n'))
  }
  
  // Warn users if `meteor-node-stubs` is missing from project dependencies
  function meteorNodeStubs() {
    if ('meteor-node-stubs' in packageJson.dependencies) {
      return;
    }
    
    console.warn([
      `⚡  Looks like ${pc.cyan('meteor-node-stubs')} is missing from your ${pc.italic('package.json')} dependencies`,
      `   Please install it: ` + pc.yellow(`${pc.dim('$')} meteor npm i meteor-node-stubs`),
    ].join('\n'));
  }
  
  function vite() {
    if (Meteor.isFibersDisabled === true) {
      // Meteor v3 should work with all Vite versions
      return;
    }
    
    const version = (dependencies['vite'] || dependencies['node_modules/vite'])?.version;
    const installCommand = pc.yellow(`${pc.dim('$')} meteor npm i vite@4`);
    if (!version) {
      console.warn([
        `⚡  Unable to determine currently installed ${pc.cyan('vite')} version`,
        `    Make sure to install it: ${installCommand}`
      ].join('\n'))
      return;
    }
    
    if (Semver.satisfies(version, '^4.0.0 || ^3.0.0')) {
      return;
    }
    
    console.warn([
      `⚡  You are using ${pc.cyan(`vite v${version}`)} which is not compatible with your current Meteor version`,
      `   Please install a compatible release: ${installCommand}`
    ].join('\n'))
  }
  
  vite();
  meteorVite();
  meteorNodeStubs();
}