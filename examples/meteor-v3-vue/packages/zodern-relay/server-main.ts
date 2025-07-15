import type * as z from "zod";
import type { Subscription } from 'meteor/meteor';
import { Meteor } from 'meteor/meteor';
import type { CreateMethodPipeline, CreatePubPipeline, PipelineContext, SubscriptionCallbacks } from './types'
import { createReactiveCursorPublisher, flattenPipeline, isThenable, partialPipeline, Subscribe, withCursors } from './pipeline-helpers';

export type { PipelineContext };

export { partialPipeline, withCursors };

let globalMethodPipeline: any[] = [];
let globalPublicationPipeline: any[] = [];

export function setGlobalMethodPipeline (
  ...pipeline: ((this: Meteor.MethodThisType, input: any, context: PipelineContext<any>) => {})[]
) {
  if (globalMethodPipeline.length > 0) {
    throw new Error('Global method pipeline already configured');
  }

  globalMethodPipeline = pipeline;
}

export function setGlobalPublicationPipeline(
  ...pipeline: ((this: Subscription, input: any, context: PipelineContext<any>) => {})[]
) {
  if (globalPublicationPipeline.length > 0) {
    throw new Error('Global publication pipeline already configured');
  }

  globalPublicationPipeline = pipeline;
}

export function createMethod <S extends z.ZodTypeAny, T > (
  config: {
    name?: string, schema: S,
    rateLimit ?: { interval: number, limit: number },
    stub?: boolean | ((this: Meteor.MethodThisType, args: z.output<S>) => any),
    run: (this: Meteor.MethodThisType, args: z.output<S>) => T }
): (...args: S extends z.ZodUndefined ? [] : [z.input<S>]) => Promise<T>
export function createMethod <S extends z.ZodTypeAny>(
  config: { name?: string, schema: S, rateLimit ?: { interval: number, limit: number } }
) : { pipeline: CreateMethodPipeline<z.output<S>> }
export function createMethod<S extends z.ZodUndefined | z.ZodTypeAny, T>(config: {
  name?: string;
  schema: S,
  stub?: any, 
  rateLimit?: {
    interval: number,
    limit: number
  },
  run?: ((this: Meteor.MethodThisType, args: z.output<S>) => T)
}): any {
  let pipeline: any = [];

  if (typeof config.run === 'function') {
    pipeline = [config.run];
  }

  // The name isn't actually optional, but the babel plugin will
  // add a name if there isn't one
  if (!config.name) {
    throw new Error(`Method name is missing. Do you have the relay babel plugin configured?`);
  }

  let name = config.name;

  Meteor.methods({
    async [name](data) {
      if (pipeline.length === 0) {
        throw new Error(`Pipeline or run function for ${name} never configured`);
      }

      let onResult: ((value: any) => void)[] = [];
      let onError: ((err: any) => any)[] = [];

      let self = this;
      let parsed: z.output<S> = config.schema.parse(data);

      let context: PipelineContext<z.output<S>> = {
        originalInput: parsed,
        type: 'method',
        name,
        onResult(callback: (result: any) => void) {
          onResult.push(callback);
        },
        onError(callback: (error: any) => any) {
          onError.push(callback);
        },
        stop() {
          // TODO: support stop in methods
          throw new Error('stop should not be called in methods');
        }
      }

      async function run() {
        let input: any = parsed;
        let fullPipeline = [...globalMethodPipeline, ...pipeline];

        for (const func of fullPipeline) {
          input = func.call(self, input, context);
          if (isThenable(input)) {
            input = await input;
          }
        }

        return input;
      }

      try {
        let result = await run();

        onResult.forEach(callback => {
          callback(result);
        });

        return result;
      } catch (error) {
        error = onError.reduce((err, callback) => {
          return callback(err) ?? err;
        }, error);

        throw error;
      }
    }
  });

  if (config.rateLimit) {
    DDPRateLimiter.addRule({
      type: 'method',
      name,
      clientAddress() { return true },
      connectionId() { return true },
      userId() { return true },
    }, config.rateLimit.limit, config.rateLimit.interval);
  }

  function call(args?: z.input<S>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      Meteor.call(name, args, (err: null | Meteor.Error, result: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  call.config = config;

  if (config.run) {
    return call;
  }

  return {
    pipeline(..._pipeline: any[]) {
      pipeline = flattenPipeline(_pipeline);
      return call;
    }
  };
}

export function createPublication<S extends z.ZodTypeAny, T>(config: { name?: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run: (this: Subscription, args: z.output<S>) => T }): (...args: z.output<S> extends undefined ? [SubscriptionCallbacks?] : [z.output<S>, SubscriptionCallbacks?]) => Meteor.SubscriptionHandle
export function createPublication<S extends z.ZodTypeAny, R1,> (config: { name?: string | null, schema: S, rateLimit ?: { interval: number, limit: number } }): { pipeline: CreatePubPipeline<z.output<S>> }
export function createPublication<S extends z.ZodTypeAny, T>(
  config: { name?: string | null, schema: S, rateLimit?: { interval: number, limit: number }, run?: ((this: Subscription, args: z.output<S>) => T) }
): any {
  let pipeline: any = config.run;

  if (typeof config.run === 'function') {
    pipeline = [config.run];
  }

  // The name isn't actually optional, but the babel plugin will
  // add a name if there isn't one
  if (typeof config.name === 'undefined') {
    throw new Error(`Publication name is missing. Do you have the relay babel plugin configured?`);
  }

  let name = config.name;

  Meteor.publish(name, async function (data: z.input<S>) {
    if (pipeline.length === 0) {
      throw new Error(`Pipeline or run function never configured for ${name} publication`);
    }

    let fullPipeline = [...globalPublicationPipeline, ...pipeline];

    let self = this;
    let parsed: z.output<S> = config.schema.parse(data);
    let stopPipelineSubscriptions: (() => void)[] = [];

    let reactivePublisher = createReactiveCursorPublisher(self);

    let dirty: { index: number, input: any } | null = null;
    let isRunning = false;
    let pipelineStopped = false;

    this.onStop(() => {
      pipelineStopped = true;
      stop();
    });

    function stop() {
      stopPipelineSubscriptions.forEach((func) => func && func());
      reactivePublisher.stop();
    }

    function markDirty(index: number, input: any) {
      if (dirty) {
        if (index < dirty.index) {
          dirty.index = index;
          dirty.input = input;
        }
        return;
      }

      dirty = {
        index,
        input
      };

      if (!isRunning) {
        Meteor.defer(runFromDirty);
      }
    }

    function runFromDirty() {
      let dirtyTmp = dirty;
      dirty = null;

      if (dirtyTmp === null) {
        throw new Error('Tried to run pipeline, but not dirty?');
      }

      run(dirtyTmp.index, dirtyTmp.input);
    }

    let onResult: ((result: any) => void)[] = [];
    let onError: ((err: any) => any)[] = [];
    let context: PipelineContext<z.output<S>> = {
      originalInput: parsed,
      type: 'publication',
      name,
      onResult(callback: (result: any) => void) {
        onResult.push(callback);
      },
      onError(callback: (error: any) => any) {
        onError.push(callback);
      },
      stop() {
        pipelineStopped = true;
        self.ready();

        stopPipelineSubscriptions.forEach(func => func && func());
        stopPipelineSubscriptions = [];
      }
    }

    async function run(startIndex: number, startInput: any) {
      if (isRunning) {
        console.log('zodern:relay Tried to run pipeline while it is already running??');
        return;
      }

      isRunning = true;
      let input = startInput;

      for (let index = startIndex; index < fullPipeline.length; index++) {
        const func = fullPipeline[index];

        let stopPrevious = stopPipelineSubscriptions[index];
        if (stopPrevious) stopPrevious();

        if (pipelineStopped) {
          break;
        }

        input = func.call(self, input, context);
        if (isThenable(input)) {
          input = await input;
        }

        if (pipelineStopped) {
          break;
        }

        if (input && input[Subscribe]) {
          let stopSubscription = input[Subscribe]((newResult: any) => {
            markDirty(index + 1, newResult);
          });

          stopPipelineSubscriptions[index] = stopSubscription;
        }
      }

      isRunning = false;

      if (pipelineStopped) {
        return;
      }

      if (dirty) {
        // TODO: it would be good if this waited a little bit
        // before running again like markDirty does
        runFromDirty();
      }

      let output = input;
      let forwardOutput = false;

      if (stopPipelineSubscriptions.length > 0) {
        // The pipeline is reactive
        // We have to handle publishing cursors ourselves

        // Meteor checks for _publishedCursor to identify cursors
        if (output && !Array.isArray(output) && output._publishCursor) {
          reactivePublisher.updateCursors([output]);
        } else if (Array.isArray(output) && output.every(c => c._publishCursor)) {
          reactivePublisher.updateCursors(output);
        }
      } else {
        forwardOutput = true;
      }

      return {
        output,
        forwardOutput
      };
    }

    try {
      const result = await run(0, parsed);

      onResult.forEach(cb => {
        cb(result.output);
      });

      return result.forwardOutput ? result.output : undefined;
    } catch(error) {
      error = onError.reduce((err, callback) => {
        return callback(err) ?? err;
      }, error);

      throw error;
    }
  });

  if (config.rateLimit) {
    if (name === null) {
      throw new Error('Cannot add rate limit for null publication');
    }

    DDPRateLimiter.addRule({
      type: 'subscription',
      name,
      clientAddress() { return true },
      connectionId() { return true },
      userId() { return true },
    }, config.rateLimit.limit, config.rateLimit.interval)
  }

  function subscribe(...args: S extends z.ZodUndefined ? [SubscriptionCallbacks?] : [z.input<S>, SubscriptionCallbacks?]): Meteor.SubscriptionHandle {
    if (name === null) {
      throw new Error('Cannot directly subscribe to null publication');
    }
    return Meteor.subscribe(name, args);
  }

  subscribe.config = config;

  if (config.run) {
    return subscribe;
  }

  return {
    pipeline(..._pipeline: any[]) {
      pipeline = flattenPipeline(_pipeline);
      return subscribe;
    }
  };
}
