import FS from 'fs/promises';
import Path from 'path';
import { ModuleList, PackageScopeExports } from '../../src/plugin/meteor/parser/Parser';

export const AllMockPackages_MeteorV2: MockModule<ModuleList>[] = [];
export const AllMockPackages_MeteorV3: MockModule<ModuleList>[] = [];

export const TsModules = prepareMock({
    packageName: 'test:ts-modules',
    fileName: 'test_ts-modules.js',
    modules: {
        'explicit-relative-path.ts': [
            { type: 'export', name: 'ExplicitRelativePath' },
        ],
        'index.ts': [
            { type: 'export', name: 'first' },
            { type: 'export', name: 'FIRST' },
            { type: 'export', name: 'b' },
            { type: 'export', name: 'c' },
            { type: 'export', name: 'namedFunction' },
            { type: 're-export', name: 'Meteor', as: 'MyMeteor', from: 'meteor/meteor', id: 0 },
            { type: 're-export', name: '*', from: 'meteor/tracker', id: 1 },
            { type: 're-export', name: 'Meteor', as: 'ReExportedMeteor', from: 'meteor/meteor', id: 2 },
            { type: 'global-binding', name: 'Meteor', from: 'meteor/meteor', id: 3 },
            { type: 're-export', name: 'NamedRelativeInteger', from: './relative-module', id: 4 },
            { type: 're-export', name: '*', from: './export-star-from', id: 5 },
            { name: 'WhereAmI', type: 're-export', id: 6, from: './subdirectory/module-in-subdirectory', as: 'WhereIsTheSubmodule' },
            { type: 'export-default', name: 'namedFunction' },
        ],
        'export-star-from.ts': [
            { type: 'export', name: 'ExportXInteger' },
            { type: 'export', name: 'ExportXString' },
            { type: 'export', name: 'ExportXObject' },
        ],
        're-exports-index.ts': [
            { type: 're-export', name: 'DefaultReExport', as: 'default', from: './re-exports-source', id: 0 },
            { type: 're-export', name: 'NamedReExport', from: './re-exports-source', id: 0 },
        ],
        're-exports-source.ts': [
            { type: 'export', name: 'DefaultReExport' },
            { type: 'export', name: 'NamedReExport' },
        ],
        'relative-module.ts': [
            { type: 'export', name: 'NamedRelativeInteger' },
        ],
        'subdirectory/module-in-subdirectory.ts': [
            { type: 'export', name: 'WhereAmI' }
        ]
    } satisfies ModuleList,
    packageScopeExports: {},
    mainModulePath: '/node_modules/meteor/test:ts-modules/index.ts'
});

export const Check = prepareMock({
    packageName: 'check',
    fileName: 'check.js',
    modules: {
        'match.js': [
            { name: 'check', type: 'export' },
            { name: 'Match', type: 'export' },
            { name: 'isPlainObject', type: 'global-binding', id: 0, from: './isPlainObject' }
        ],
        'isPlainObject.js': [
            { name: 'isPlainObject', type: 'export' }
        ]
    },
    packageScopeExports: {
        'check': ['check', 'Match']
    },
    mainModulePath: '/node_modules/meteor/check/match.js'
});

export const Mongo = prepareMock({
    fileName: 'mongo.js',
    modules: {
    
    },
    packageName: 'mongo',
    packageScopeExports: {
        'mongo': ['Mongo'],
    },
    mainModulePath: ''
})

export const MeteorJs = prepareMock({
    fileName: 'meteor.js',
    modules: {},
    packageName: 'meteor',
    packageScopeExports: {
        'meteor': ['Meteor', 'global', 'meteorEnv']
    },
    mainModulePath: '',
});

export const ReactMeteorData = prepareMock({
    fileName: 'react-meteor-data.js',
    packageName: 'react-meteor-data',
    packageScopeExports: {},
    modules: {
        'index.js': [
            { type: 'global-binding', name: 'default', from: 'react', id: 0, },
            { type: 're-export', name: 'useTracker', from: './useTracker', id: 1, },
            { type: 're-export', name: 'withTracker', from: './withTracker.tsx', id: 2, },
            { type: 're-export', name: 'useFind', from: './useFind', id: 3, },
            { type: 're-export', name: 'useSubscribe', from: './useSubscribe', id: 4, },
        ],
        'useFind.ts': [
            { type: 'export', name: 'useFind' },
        ],
        'useSubscribe.ts': [
            { type: 'export', name: 'useSubscribe' },
        ],
        'useTracker.ts': [
            { type: 'export', name: 'useTracker' },
        ],
        'withTracker.tsx': [
            { type: 'export', name: 'withTracker' },
        ]
    },
    mainModulePath: '',
})

export const TestLazy = prepareMock({
    packageName: 'test:lazy',
    fileName: 'test_lazy.js',
    modules: {
        'index.js': [
            { type: 'export', name: 'MEOWMEOW' },
        ]
    },
    packageScopeExports: {},
    mainModulePath: ''
});

export const OstrioCookies = prepareMock({
    packageName: 'ostrio:cookies',
    fileName: 'ostrio_cookies.js',
    modules: {
        'cookies.js': [
            { type: 'export', name: 'Cookies' },
            { type: 'global-binding', name: 'Meteor', from: 'meteor/meteor', id: 0 }
        ]
    },
    packageScopeExports: {},
    mainModulePath: '/node_modules/meteor/ostrio:cookies/cookies.js',
})

export const RdbSvelteMeteorData = prepareMock({
    packageName: 'rdb:svelte-meteor-data',
    fileName: 'rdb_svelte-meteor-data.js',
    modules: {
        'index.js': [
            { type: 'global-binding', name: 'checkNpmVersions', from: 'meteor/tmeasday:check-npm-versions', id: 0 },
            { type: 're-export', name: 'default', as: 'useTracker', from: './use-tracker', id: 1 },
            { type: 're-export', name: 'default', as: 'useSession', from: './use-session', id: 2 },
        ],
        'use-session.js': [
            { type: 'export-default', }
        ],
        'use-tracker.js': [
            { type: 'export-default', }
        ],
    },
    packageScopeExports: {
    
    },
    mainModulePath: '/node_modules/meteor/rdb:svelte-meteor-data/index.js',
})

export const MeteorV3Mocks = {
    Mongo: prepareMock({
        fileName: 'mongo.js',
        modules: {
        
        },
        packageName: 'mongo',
        packageScopeExports: {
            'mongo': ['Mongo'],
        },
        mainModulePath: '',
        meteorVersion: 3,
    })
}

function prepareMock<Modules extends ModuleList>({ fileName, meteorVersion = 2, ...details }: PrepareMockModule<Modules>): MockModule<Modules> {
    const filePath = Path.join(__dirname, `meteor-bundle`, `meteor-v${meteorVersion}`, `${fileName}.bundle`);
    const packageId = `meteor/${details.packageName}`;
    
    const mock = {
        fileName,
        filePath,
        packageId,
        fileContent: FS.readFile(filePath, 'utf-8'),
        meteorVersion,
        ...details,
    }
    
    if (meteorVersion === 3) {
        AllMockPackages_MeteorV3.push(mock);
    } else {
        AllMockPackages_MeteorV2.push(mock);
    }
    
    return mock;
}

/**
 * A lazy-loaded package before we've forced an import into the Meteor entrypoint.
 */
export const LazyLoadedPackage = new class {
    public readonly packages = {
        TestLazy: this.prepareMock({
            fileName: 'test_lazy.js',
            packageName: 'test:lazy',
            meteorVersion: 2,
        }),
    }
    
    protected prepareMock(lazyMock: {
        fileName: string;
        packageName: string;
        meteorVersion: 3 | 2,
    }) {
        const filePath = Path.join(__dirname, `meteor-bundle/meteor-v${lazyMock.meteorVersion}/pre-auto-import/`, `${lazyMock.fileName}.bundle`);
        return {
            filePath,
            fileContent: FS.readFile(filePath, 'utf-8'),
            ...lazyMock,
        }
    }
}

export const AutoImportMock = new class {
    protected readonly sourceDir = Path.join(__dirname, '/auto-imports/entrypoint');
    public readonly outDir = Path.join(this.sourceDir, '.temp');
    
    public readonly entrypoints = {
        empty: 'empty.js',
        withExistingAutoImports: 'with-existing-auto-imports.js',
        withUnrelatedImports: 'with-unrelated-imports.js',
    }
    
    public async useEntrypoint({ testName, entrypoint }: {
        testName: string;
        entrypoint: keyof typeof AutoImportMock.entrypoints,
    }) {
        const outPath = Path.join(this.outDir, testName, `${entrypoint}.js`);
        const sourcePath = Path.join(this.sourceDir, this.entrypoints[entrypoint]);
        
        const template = await FS.readFile(sourcePath, 'utf-8');
        
        await FS.mkdir(Path.dirname(outPath), { recursive: true });
        await FS.writeFile(outPath, template);
        
        return {
            template,
            meteorEntrypoint: outPath,
            readContent: () => FS.readFile(outPath, 'utf-8'),
        }
    }
    
}

interface PrepareMockModule<Modules extends ModuleList> {
    fileName: string;
    packageName: string;
    modules: Modules;
    packageScopeExports: PackageScopeExports,
    mainModulePath: string;
    meteorVersion?: 2 | 3;
}

interface MockModule<Modules extends ModuleList> extends PrepareMockModule<Modules> {
    filePath: string;
    fileContent: Promise<string>;
    packageId: string;
    meteorVersion: 2 | 3;
}
