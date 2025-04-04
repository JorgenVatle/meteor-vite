const { z } = require('zod');
import { createMethod, partialPipeline, setGlobalMethodPipeline } from 'meteor/zodern:relay';
import assert from 'assert';

export const test1 = createMethod({
  name: 'test1',
  schema: z.any(),
  run() {
    return 5;
  }
});

export const errorMethod = createMethod({
  name: 'errorMethod',
  schema: z.any(),
  run() {
    throw new Meteor.Error('test error');
  }
});

export const methodUnblock = createMethod({
  name: 'methodUnblock',
  schema: z.number(),
  run() {
    this.unblock();
  }
})

export const schema = z.any();
export function run() { };

export const configMethod = createMethod({
  name: 'a',
  schema,
  run
});

export const rateLimited = createMethod({
  name: 'rateLimited',
  schema: z.any(),
  rateLimit: {
    interval: 1000,
    limit: 5
  },
  run() {
    return true;
  }
});

export const wait100 = createMethod({
  name: 'wait100',
  schema: z.any(),
  async run() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
});

export const fastMethod = createMethod({
  name: 'fast',
  schema: z.any(),
  async run() {
    return 5;
  }
});

export const simplePipeline = createMethod({
  name: 'simplePipeline',
  schema: z.number(),
}).pipeline(
    (n) => n + 5,
    (n) => n - 1,
    (n) => n + 0.5
);

export const asyncPipeline = createMethod({
  name: 'asyncPipeline',
  schema: z.number()
}).pipeline(
  async (n) => n + 5,
  (n) => Promise.resolve(n - 1),
  async (n) => n + 0.5
);

const partial = partialPipeline(
  (i) => i + 10,
  (i) => i / 2
);

const partial2 = partialPipeline(partial);

export const partialMethod = createMethod({
  name: 'partial',
  schema: z.number()
}).pipeline(
  partial2,
  (i) => i.toFixed(1)
);

export const contextMethod = createMethod({
  name: 'context',
  schema: z.number()
}).pipeline(
  (input, context) => {
    resetEvents();
    return true
  },
  (input, context) => {
    assert.equal(input, true);
    assert.equal(typeof context.originalInput, 'number');
    assert.equal(context.type, 'method');
    assert.equal(context.name, 'context');

    context.onResult(r => {
      events.push(`result: ${r}`);
    });

    return input;
  }
);

export const contextFailedMethod = createMethod({
  name: 'contextFailedMethod',
  schema: z.number()
}).pipeline(
  (input, context) => {
    resetEvents();
    context.onError(err => {
      events.push(err.message);
    });
    context.onError(err => {
      events.push(err.message);
      return new Meteor.Error('second err');
    });
    context.onResult(() => {
      events.push('result');
    });
  },
  () => {
    throw new Error('first err');
  }
);

setGlobalMethodPipeline(
  (input, context) => {
    if (context.name === 'globalPipelineMethod') {
      return input + 1;
    }

    return input;
  }
);

export const globalPipelineMethod = createMethod({
  name: 'globalPipelineMethod',
  schema: z.number(),
  run(input) {
    return input;
  }
});

export const unnamedMethod = createMethod({
  schema: z.number(),
  run(input) {
    return input / 2;
  }
});

export const stubRunMethod = createMethod({
  schema: z.number(),
  stub: true,
  run(input) {
    if (Meteor.isClient) {
      window.stub = true;
    }
    return input / 2;
  }
});

export const stubMethod = createMethod({
  schema: z.number(),
  stub: true,
  run(input) {
    if (Meteor.isClient) {
      window.stub = true;
    }
    return input / 2;
  }
});

// Used for publication tests

export const Numbers = new Mongo.Collection('numbers');
export const Selected = new Mongo.Collection('selected');

Numbers.remove({});
Selected.remove({});

for(let i = 0; i < 100; i++) {
  Numbers.insert({ num: i });
}

let events = [];

export function recordEvent(text) {
  events.push(text);
}

export function resetEvents() {
  events = [];
}

export const getEvents = createMethod({
  name: 'getEvents',
  schema: z.undefined(),
  run() {
    return events;
  }
});

export const addSelected = createMethod({
  name: 'addSelected',
  schema: z.number(),
  run(num) {
    return Selected.insert({
      _id: num.toString(),
      num
    });
  }
});

export const removeSelected = createMethod({
  name: 'removeSelected',
  schema: z.string(),
  run(id) {
    return Selected.remove({
      _id: id
    });
  }
});

export const updateSelected = createMethod({
  name: 'updateSelected',
  schema: z.object({ id: z.string(), num: z.number() }),
  run({ id, num }) {
    return Selected.update(
      { _id: id },
      { $set: { num } }
    );
  }
});
