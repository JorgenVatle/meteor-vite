import { ModuleRunner } from './ModuleRunner';

const { LoggerInstance } = await ModuleRunner.import('utilities/server');

export default new LoggerInstance({
    debugKey: 'vite-bundler',
    label: 'vite-bundler',
});

