import { describe, expect, it } from 'vitest';
import AutoImportQueue, { wait } from '../src/plugin/meteor/package/AutoImportQueue';
import { RefreshNeeded } from '../src/plugin/ViteLoadRequest';
import { AutoImportMock } from './__mocks';

describe('Package auto-imports', async () => {
    describe('With existing, unrelated content', async () => {
        
        it('can add imports', async (context) => {
            const importString = 'meteor/test:can-add-imports';
            const { meteorEntrypoint, template, readContent } = await AutoImportMock.useEntrypoint({
                testName: context.task.name,
                entrypoint: 'withUnrelatedImports',
            });
            
            await AutoImportQueue.write({
                importString,
                meteorEntrypoint,
                skipRestart: true,
            })
            const newContent = await readContent();
            
            expect(newContent).toContain(`'${importString}'`);
        });
        
        it('does not modify original content', async (context) => {
            const importString = 'meteor/test:does-not-modify-original-content';
            const { meteorEntrypoint, template, readContent } = await AutoImportMock.useEntrypoint({
                testName: context.task.name,
                entrypoint: 'withUnrelatedImports',
            });
            
            await AutoImportQueue.write({
                importString,
                meteorEntrypoint,
                skipRestart: true,
            })
            const newContent = await readContent();
            
            expect(newContent).toContain(`'${importString}'`);
            expect(newContent).toContain(template);
        });
        
        it('does not add the same import twice', async (context) => {
            const importString = 'meteor/test:duplicate-import';
            const matchRegex = /meteor\/test:duplicate-import/;
            const importStrings = [importString, importString];
            
            const { meteorEntrypoint, template, readContent } = await AutoImportMock.useEntrypoint({
                testName: context.task.name,
                entrypoint: 'withUnrelatedImports',
            });
            
            const importRequests = importStrings.map((importString) => AutoImportQueue.write({
                importString,
                meteorEntrypoint,
                skipRestart: true,
            }));
            await Promise.all(importRequests);
            const newContent = await readContent();
            
            expect(newContent.match(matchRegex)?.length).toEqual(1);
        })
    });
    
    type EntryPoints = typeof AutoImportMock['entrypoints'];
    const testCases: { entrypoint: keyof EntryPoints }[] = [
        { entrypoint: 'withExistingAutoImports' },
        { entrypoint: 'withUnrelatedImports' },
        { entrypoint: 'empty' },
    ];
    
    describe.each(testCases)('Concurrent Requests: $entrypoint', ({ entrypoint }) => {
        it('throws a "RefreshNeeded" exception for all import requests', async (context) => {
            const requests: Promise<void>[] = [];
            const { meteorEntrypoint } = await AutoImportMock.useEntrypoint({
                testName: context.task.name,
                entrypoint,
            });
            for (let id = 0; id < 10; id++) {
                const importString = `meteor/test:refresh-needed-${id}`;
                requests.push(AutoImportQueue.write({
                    importString,
                    meteorEntrypoint,
                    skipRestart: false,
                }))
            }
            
            expect.assertions(10);
            const rejections = requests.map((promise) => expect(promise).rejects.toThrow(RefreshNeeded));
            await Promise.all(rejections);
        })
        
        describe('Staggered - submitted within the countdown time-limit', async () => {
            const IMPORT_COUNT = 10;
            const { processingTime, newContent, expectedImports, template, queue } = await AutoImportMock.useEntrypoint({
                testName: 'staggered requests within the time limit',
                entrypoint,
            }).then(async ({ meteorEntrypoint, template, readContent }) => {
                const importRequests: Promise<void>[] = [];
                const expectedImports: string[] = [];
                const startTime = Date.now();
                
                
                for (let number = 0; number < IMPORT_COUNT; number++) {
                    const importString = `meteor/test:staggered-import-${number}`;
                    expectedImports.push(importString);
                    const request = AutoImportQueue.write({
                        importString,
                        meteorEntrypoint,
                        skipRestart: false,
                    });
                    importRequests.push(request);
                    const waitTime = (AutoImportQueue.RESTART_COUNTDOWN_MS / 10) + (Math.random() > 0.5 ? 70 : 25)
                    
                    await wait(waitTime);
                }
                
                const queue = Promise.all(importRequests);
                
                return {
                    processingTime: await queue.catch(() => Date.now() - startTime),
                    newContent: await readContent(),
                    expectedImports,
                    template,
                    queue,
                }
            });
            
            it('will extend the restart countdown with new requests', () => {
                console.log({ processingTime });
                expect(processingTime).toBeGreaterThan(AutoImportQueue.RESTART_COUNTDOWN_MS)
            });
            it('emits a "refresh needed" error on timeout', async () => {
                await expect(queue).rejects.toThrow(RefreshNeeded)
            });
            it.skipIf(entrypoint === 'withExistingAutoImports')('retains existing entrypoint source code', () => {
                expect(newContent).toContain(template);
            });
            it('adds all requested imports to the entrypoint file', () => {
                expect(expectedImports).toHaveLength(IMPORT_COUNT);
                expectedImports.forEach((importString) => expect(newContent).toContain(importString));
            })
        })
    })
})