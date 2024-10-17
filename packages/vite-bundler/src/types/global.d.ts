declare global {
    interface PromiseConstructor {
        await<T>(promise: Promise<T>): T;
    }
    
    namespace NodeJS {
        interface ProcessEnv {
            VITE_METEOR_DISABLED?: string; // Use to disable the build plugin entirely. E.g. for publishing the package.
        }
    }
    
    module Plugin {
        type CompilerPluginConfig = {
            extensions: string[];
            filenames: string[];
        }
        type FactoryFunction = () => { processFilesForTarget(): void };
        function registerCompiler(config: CompilerPluginConfig, compilerFactory: FactoryFunction): void;
    }
    
    module Babel {
        type CompileOptions = {
            babelrc: boolean;
            sourceMaps: boolean;
            filename: string;
            sourceFileName: string;
            caller?: Record<string, unknown>;
        };
        function compile(source: string, compileOptions: CompileOptions, babelOptions: object): {
            code: string;
        }
        function getDefaultOptions(): CompileOptions;
    }
    
    const __meteor_bootstrap__: {
        startupHooks: unknown;
        serverDir: string;
        configJson: {
            meteorRelease: string;
            appId: string;
            clientArchs: string[]
        }
        isFibersDisabled: boolean;
    }
    
    module Assets {
        function getTextAsync(path: string): Promise<string>;
    }
}

export {}
