import { PipelineContext } from './types';
import type { Meteor, Subscription } from 'meteor/meteor';
import type { Mongo } from 'meteor/mongo';

type Step<I, R> = (this: Subscription | Meteor.MethodThisType, input: I, context: PipelineContext<unknown>) => R

const Pipeline = Symbol('zodern:relay:pipeline');
export const Subscribe = Symbol('zodern:relay:subscribe');

export function partialPipeline<I, R1>(step1: Step<I, R1>): (input: I) => R1
export function partialPipeline<I, R1, R2>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>): (input: I) => R2
export function partialPipeline<I, R1, R2, R3>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>): (input: I) => R3
export function partialPipeline<I, R1, R2, R3, R4>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>, step4: Step<Awaited<R3>, R4>): (input: I) => R4
export function partialPipeline<I, R1, R2, R3, R4, R5>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>, step4: Step<Awaited<R3>, R4>, step5: Step<Awaited<R4>, R5>): (input: I) => R5
export function partialPipeline<I, R1, R2, R3, R4, R5, R6>(step1: Step<I, R1>, step2: Step<Awaited<R1>, R2>, step3: Step<Awaited<R2>, R3>, step4: Step<Awaited<R3>, R4>, step5: Step<Awaited<R4>, R5>, step6: Step<Awaited<R5>, R6>): (input: I) => R6
export function partialPipeline(...steps: any[]): (input: any) => any {
  const fn = (input: any) => {
    throw new Error('partial pipelines should not be called directly');
  };

  (fn as any)[Pipeline] = steps;

  return fn;
}

export function flattenPipeline(pipeline: any[]) {
  let result: Function[] = [];

  for (const step of pipeline) {
    if (step[Pipeline]) {
      result.push(...flattenPipeline(step[Pipeline]));
    } else {
      result.push(step);
    }
  }

  return result;
}

export function isThenable(possiblePromise: any): possiblePromise is Promise<any> {
  return possiblePromise && typeof possiblePromise.then === 'function';
}

export function withCursors<I extends object, T extends Record<string, Mongo.Cursor<any>>>(input: I, cursors: T):
  I & { [K in keyof T]: T[K] extends Mongo.Cursor<infer X> ? X[] : never } {
  let hasUpdate = false;
  let updateInput = () => { hasUpdate = true };
  let handles: Meteor.LiveQueryHandle[] = [];
  let docs: {
    [K in keyof T]: T[K] extends Mongo.Cursor<infer X> ? X[] : never
  } = Object.entries(cursors).reduce((result: any, [name, cursor]) => {
    result[name] = [];
    let initialAdd = true;

    let handle = cursor.observe({
      addedAt(document, index) {
        result[name].splice(index, 0, document);
        if (!initialAdd) {
          updateInput();
        }
      },
      changedAt(doc, _old, index) {
        result[name][index] = doc;
        updateInput();
      },
      removedAt(_doc, index) {
        result[name].splice(index, 1);
        updateInput();
      },
      movedTo(_doc, fromIndex, toIndex) {
        let [doc] = result[name].splice(fromIndex, 1);
        // toIndex already accounted for removing the doc at fromIndex
        // could change the toIndex
        result[name].splice(toIndex, 0, doc);

        // Don't update input since there will also be a
        // call to changedAt to apply the changes that caused
        // the document to move
      }
    });

    initialAdd = false;
    handles.push(handle);

    return result;
  }, {});

  function createOutput() {
    return Object.assign({}, input, docs);
  }

  let initialOutput = createOutput();
  (initialOutput as any)[Subscribe] = function (_updateInput: (data: any) => void) {
    updateInput = () => _updateInput(createOutput());
    if (hasUpdate) {
      updateInput();
      hasUpdate = false;
    }

    return function stop() {
      handles.forEach(handle => handle.stop());
    }
  }

  return initialOutput;
}

export function createReactiveCursorPublisher(sub: Subscription) {
  let handles: Meteor.LiveQueryHandle[] = [];
  let publishedData: {
    [key: string]: Map<string, any>
  } = Object.create(null);

  function updateCursors(cursors: Mongo.Cursor<any> []) {
    handles.forEach(handle => handle.stop());

    // Make sure no more than one per collection
    let colls = new Set();
    cursors.forEach(cursor => {
      let coll = (cursor as any)._cursorDescription.collectionName;
      if (colls.has(coll)) {
        throw new Error(`Publishing more than one cursor for the collection: ${coll}`);
      }

      colls.add(coll);
    });

    let previouslyPublished = publishedData;
    publishedData = Object.create(null);

    // TODO: check if the cursors changed. If a cursor is the same, we could
    // reuse the old handle
    cursors.forEach(cursor => {
      let coll = (cursor as any)._cursorDescription.collectionName;

      let previousData = previouslyPublished[coll] || new Map();
      delete previouslyPublished[coll];
      let data = publishedData[coll] = new Map();

      let handle = cursor.observeChanges({
        added(id, fields) {
          if (previousData.has(id)) {
            // Some fields might no longer be part of the new cursor
            // Set all old fields to undefined, and then override any
            // that still exist with the new value
            // Fields that are still undefined will be removed by Meteor
            let prevFields = Object.keys(previousData.get(id))
              .reduce<{ [key: string]: undefined }>((result, field) => {
                result[field] = undefined;
                return result;
              }, {});
            sub.changed(coll, id, Object.assign(prevFields, fields));
            previousData.delete(id);
          } else {
            sub.added(coll, id, fields);
          }

          data.set(id, fields);
        },
        changed(id, fields) {
          sub.changed(coll, id, fields);
          let oldFields = data.get(id);
          // TODO: do we need to clone oldFields?
          data.set(id, Object.assign({}, oldFields, fields));
        },
        removed(id) {
          sub.removed(coll, id);
          data.delete(id);
        }
      });

      // Remove docs that are no longer found by the new cursor
      for (const id of previousData.keys()) {
        sub.removed(coll, id);
      }

      handles.push(handle);
    });

    Object.entries(previouslyPublished).forEach(([ coll, docs]) => {
      for (const id of docs.keys()) {
        sub.removed(coll, id);
      }
    });

    sub.ready();
  }

  function stop() {
    handles.forEach(handle => handle.stop());
  }

  return { updateCursors, stop };
}
