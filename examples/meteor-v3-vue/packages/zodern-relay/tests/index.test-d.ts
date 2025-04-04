import { expectError, expectType } from 'tsd';
import { z } from 'zod';
import { partialPipeline } from '../pipeline-helpers';
import { createMethod, createPublication } from '../server-main';

const undefinedMethod = createMethod({
  name: 'test',
  schema: z.undefined(),
  run() {
    return 5;
  }
});

const objMethod = createMethod({
  name: 'test2',
  schema: z.object({
    a: z.number(),
    b: z.string()
  }),
  run() {
    return true;
  }
});

const stringMethod = createMethod({
  name: 'test3',
  schema: z.string(),
  run() {
    return 55;
  }
});

const anyMethod = createMethod({
  name: 'test4',
  schema: z.any(),
  run() {
    return 'abc';
  }
});

const pipelineMethod = createMethod({
  name: 'test5',
  schema: z.number(),
}).pipeline(
  (i) => i + 5,
  (i) => i - 1,
  (i) => i / 2
);

const asyncPipeline = createMethod({
  name: 'test5',
  schema: z.number()
}).pipeline(
  async (i) => i + 5,
  (i) => i - 1,
  (i) => i / 2
);

const partial = partialPipeline(
  <I extends { a: number }>({ a }: I) => a,
  (i) => i / 2,
);

const partialAsync = partialPipeline(
  <I extends { a: number }>({ a }: I) => a,
  async (i) => i / 2,
  (i) => i
);

const partialBoolean = partialPipeline(
  <I>(i: I) => i,
  () => true
)

const subPipeline = partialPipeline(partialBoolean, reusableStep);

const partialMethod = createMethod({
  name: 'test6',
  schema: z.object({ a: z.number(), b: z.string() })
}).pipeline(
  (input) => input,
  (i) => i,
  partial,
  (i) => i,
  );

const subPartialMethod = createMethod({
  name: 'subPartialMethod',
  schema: z.string()
}).pipeline(subPipeline, (i) => !i);

function reusableStep<I>(input: I) {
  return input;
}

const reusableMethod = createMethod({
  name: 'test7',
  schema: z.object({ a: z.number(), b: z.string() })
}).pipeline(
  (input) => input,
  reusableStep,
  (i) => i,
);

const undefinedPipeline = createMethod({
  name: 'test8',
  schema: z.undefined()
}).pipeline(
  () => 5
);

const stubMethod = createMethod({
  name: 'test4',
  schema: z.undefined(),
  // stub() {
  //   return 10 / 2
  // },
  run() {
    return 5;
  }
});

const stubMethod2 = createMethod({
  name: 'test5',
  schema: z.undefined(),
  stub: true,
  run() {
    return 20;
  }
});

expectType<Promise<number>>(undefinedMethod());
expectError(undefinedMethod(5));

expectType<Promise<boolean>>(objMethod({ a: 5, b: 'abc' }));
expectError(objMethod());
expectError(objMethod(5));

expectType<Promise<number>>(stringMethod('fun'));
expectError(stringMethod());
expectError(stringMethod({ a: 20 }));

expectType<Promise<string>>(anyMethod('123'));

expectType<Promise<number>>(partialMethod({ a: 5, b: 'true' }));

expectType<Promise<{ a: number, b: string }>>(reusableMethod({ a: 5, b: 'test' }));

expectType<Promise<number>>(undefinedPipeline());
expectError(undefinedMethod(5));

expectType<Promise<boolean>>(subPartialMethod('fun'));

// TODO: fix this
// expectType<Promise<string>>(anyMethod());

expectType<Promise<number>>(pipelineMethod(20));
expectError(pipelineMethod('5'));

expectType<Promise<number>>(asyncPipeline(20));

expectType<number>(partial({ a: 5 }));
expectError(partial({ a: 'a' }));

expectType<number>(partialAsync({ a: 5 }));

expectType<(s: string) => Promise<string | null>>(createMethod({
  name: 'fun',
  schema: z.string()
}).pipeline(
  (input, context) => context.name,
  (input, context) => {
    context.onError((err: any) => new Error('test'));
    context.onResult((result: any) => console.log(result));
    context.type.substring(0, 5);

    return input;
  }
));

expectType<(s: string) => Promise<string>>(createMethod({
  name: 'fun',
  schema: z.string()
}).pipeline(
  (input) => true,
  (input, context) => {
    return context.originalInput
  }
));

expectType<Promise<number>>(stubMethod(5));
expectType<Promise<number>>(stubMethod2());
expectError(createMethod({
  schema: z.number(),
  stub: true
}));

expectError(createMethod({
  schema: z.number(),
  stub() {
    return 5;
  }
}));


const undefinedSubscribe = createPublication({
  name: 'test',
  schema: z.undefined(),
  run() {
  }
});

const objSubscribe = createPublication({
  name: 'test2',
  schema: z.object({
    a: z.number(),
    b: z.string()
  }),
  run() {
  }
});

const stringSubscribe = createPublication({
  name: 'test3',
  schema: z.string(),
  run() {
  }
});

const anySubscribe = createPublication({
  name: 'test4',
  schema: z.any(),
  run() {
  }
});

expectType<Meteor.SubscriptionHandle>(undefinedSubscribe());
expectError(undefinedSubscribe(5));

expectType<Meteor.SubscriptionHandle>(objSubscribe({ a: 5, b: 'abc' }));
expectError(objSubscribe());
expectError(objSubscribe(5));

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun'));
expectError(stringSubscribe());
expectError(stringSubscribe({ a: 20 }));

expectType<Meteor.SubscriptionHandle>(anySubscribe('123'));
// TODO: fix this
// expectType<Meteor.SubscriptionHandle>(anySubscribe());

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun2', {
  onStop(err: Error) {
    console.log(err);
  }
}));

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun3', {
  onReady() {
    console.log('ready');
  }
}));

expectType<Meteor.SubscriptionHandle>(undefinedSubscribe({
  onReady() {
    console.log('ready');
  }
}));

expectType<Meteor.SubscriptionHandle>(stringSubscribe('fun3', {}));

expectType<Meteor.SubscriptionHandle>(createPublication({
  name: 'fun',
  schema: z.string()
}).pipeline(
  (input, context) => context.name,
  (input, context) => {
    context.onError((err: any) => new Error('test'));
    context.onResult((result: any) => console.log(result));
    context.type.substring(0, 5);

    return input;
  }
)('test'));
