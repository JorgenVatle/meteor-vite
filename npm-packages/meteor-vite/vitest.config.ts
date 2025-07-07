import { defineConfig } from 'vitest/config';

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
            { find: /^@\//, replacement: `${__dirname}/src/` }
        ]
    }
})