import fs from 'fs-extra';
import { Meteor } from 'meteor/meteor';
import path from 'node:path';
import Compiler, { BUNDLE_FILE_EXTENSION } from './plugin/Compiler';
import { prepareViteBundle, ViteBundleOutput } from './plugin/IntermediaryMeteorProject';
import { getBuildConfig } from './utility/Helpers';
import Logger from './utility/Logger';

const {
  isSimulatedProduction,
  viteOutSrcDir,
  pluginEnabled,
} = getBuildConfig();

// Empty stubs from any previous builds
if (pluginEnabled) {
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
