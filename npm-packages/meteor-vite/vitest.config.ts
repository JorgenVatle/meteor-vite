import Path from 'path';
import { defineConfig } from 'vitest/config';

const __dirname = new URL('.', import.meta.url).pathname;

export default defineConfig({
    test: {
        include: [
            'test/*.{test,spec}.?(c|m)[jt]s?(x)',
            'test/**/*.{test,spec}.?(c|m)[jt]s?(x)'
        ],
        exclude: [
            'test/__mocks/**',
        ]
    },
    
    resolve: {
        alias: [
            { find: /^@\//, replacement: Path.join(__dirname, 'src', '/') },
        ]
    }
})