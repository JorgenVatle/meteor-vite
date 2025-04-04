import { createPublication, withCursors, partialPipeline, setGlobalPublicationPipeline } from 'meteor/zodern:relay';
import { Numbers, recordEvent, resetEvents, Selected } from '../methods/index';
const { z } = require('zod');
import assert from 'assert';

export const subscribeBasic = createPublication({
  name: 'basic',
  schema: z.any(),
  run() {
    return []
  }
});

export const subscribeError = createPublication({
  name: 'error',
  schema: z.any(),
  run() {
    throw new Meteor.Error('pub err');
  }
});

export const subscribeRateLimited = createPublication({
  name: 'rateLimited',
  schema: z.any(),
  rateLimit: {
    interval: 1000,
    limit: 5
  },
  run() {
    return [];
  }
});

export const subscribeSlow = createPublication({
  name: 'slow',
  schema: z.any(),
  async run() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  }
});


export const subscribeFast = createPublication({
  name: 'fast',
  schema: z.any(),
  async run() {
    return [];
  }
});

export const subscribePipeline = createPublication({
  name: 'pipeline',
  schema: z.number(),
  run: [
    (i) => {
      resetEvents();
      recordEvent(`input: ${i}`);
      return i
    },
    async (i) => i + 10,
    (i) => {
      recordEvent(`complete: ${i}`);
      return []
    }
  ]
});

const partial = partialPipeline(
  (i) => i + 10,
  (i) => i / 2
)

export const subscribePartial = createPublication({
  name: 'partial',
  schema: z.number()
}).pipeline(
  (i) => {
    resetEvents();
    return i;
  },
  partial,
  (i) => i.toFixed(1),
  (i) => recordEvent(`complete: ${i}`),
  () => []
);

export const subscribeContext = createPublication({
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
    assert.equal(context.type, 'publication');
    assert.equal(context.name, 'context');

    context.onResult(r => {
      recordEvent(`result: ${JSON.stringify(r)}`);
    });

    return [];
  }
);

export const subscribeFailedContext = createPublication({
  name: 'contextFailed',
  schema: z.number()
}).pipeline(
  (input, context) => {
    resetEvents();
    context.onError(err => {
      recordEvent(err.message);
    });
    context.onError(err => {
      recordEvent(err.message);
      return new Meteor.Error('second err');
    });
    context.onError(err => {
      recordEvent(err.message);
    });
    context.onResult(() => {
      recordEvent('result');
    });
  },
  () => {
    throw new Error('first err');
  }
);

setGlobalPublicationPipeline(
  (input, context) => {
    if (context.name === 'globalPipelinePub') {
      return input + 1;
    }

    return input;
  }
);

export const globalPipelinePub = createPublication({
  name: 'globalPipelinePub',
  schema: z.number(),
  run(input) {
    resetEvents();
    recordEvent(`input: ${input}`);

    return [];
  }
});

export const reactiveSubscribe = createPublication({
  name: 'reactivePub',
  schema: z.undefined(),
}).pipeline(
  () => {
    Selected.remove({});
    resetEvents();
  },
  () => {
    recordEvent('Run Selectors step');
    return withCursors({}, {
      selected: Selected.find({}, { sort: { num: 1 } })
    });
  },
  ({ selected }) => {
    let selectedDescription = selected.map(s => {
      return `${s._id} - ${s.num}`;
    }).join(', ');
    recordEvent(`Selected: ${selectedDescription}`);

    return Numbers.find({
      num: { $in: selected.map(s => s.num )}
    });
  }
);

export const unnamedSubscribe = createPublication({
  schema: z.undefined(),
  run() {
    return []
  }
});
