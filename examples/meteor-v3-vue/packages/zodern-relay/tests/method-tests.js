const {
  schema,
  run,
  test1,
  rateLimited,
  errorMethod,
  wait100,
  fastMethod,
  configMethod,
  simplePipeline,
  asyncPipeline,
  methodUnblock,
  partialMethod,
  contextMethod,
  getEvents,
  contextFailedMethod,
  globalPipelineMethod,
  unnamedMethod,
  stubMethod,
  stubRunMethod
} = require('./methods/index.js');

Tinytest.addAsync('methods - basic', async (test) => {
  const result = await test1();
  test.equal(result, 5);
});

Tinytest.addAsync('methods - error', async (test) => {
  try {
    await errorMethod();
    test.equal('should never be reached', true);
  } catch (e) {
    test.equal(e.message, '[test error]');
  }
});

Tinytest.addAsync('methods - unblock', async (test) => {
  const result = await methodUnblock(5);
  test.equal(result, undefined);
});

if (Meteor.isServer) {
  Tinytest.add('methods - config server', async (test) => {
    test.equal(configMethod.config.name, 'a');
    test.equal(configMethod.config.schema, schema);
    test.equal(configMethod.config.run, run);
  });
} else {
  Tinytest.add('methods - config client', async (test) => {
    test.equal(Object.keys(test1.config), ['name']);
    test.equal(test1.config.name, 'test1');
  });
}

if (Meteor.isClient) {
  Tinytest.addAsync('methods - rate limit', async (test) => {
    for (let i = 0; i < 5; i++) {
      await rateLimited();
    }

    try {
      await rateLimited();
      test.equal('should never be reached', true);
    } catch (e) {
      test.equal(e.error, 'too-many-requests');
    }
  });
}

Tinytest.addAsync('methods - async block by default', async (test) => {
  let order = [];

  await Promise.all([
    wait100().then(() => order.push('wait100')),
    fastMethod().then(() => order.push('fastMethod'))
  ]);

  test.equal(order, ['wait100', 'fastMethod']);
});

if (Meteor.isClient) {
  Tinytest.add('methods - error if created on client', (test) => {
    try {
      require('./methods.js');
      test.equal('should never be reached', true);
    } catch (e) {
      test.equal(e.message, 'createMethod should never be called on the client.\nEnsure you have @zodern/babel-plugin-meteor-reify configured, or\nyou are calling createMethod only in files inside a methods directory')
    }
  });
}

Tinytest.addAsync('methods - pipeline', async (test) => {
  const result = await simplePipeline(10)

  test.equal(result, 14.5);
});

Tinytest.addAsync('methods - async pipeline', async (test) => {
  const result = await asyncPipeline(10)

  test.equal(result, 14.5);
});

Tinytest.addAsync('methods - partial pipeline', async (test) => {
  const result = await partialMethod(3.33)

  test.equal(result, '6.7');
});

Tinytest.addAsync('methods - context success', async (test) => {
  const result = await contextMethod(5);
  test.equal(result, true);

  const events = await getEvents();
  test.equal(events, ['result: true']);
});


Tinytest.addAsync('methods - context error', async (test) => {
  try {
    await contextFailedMethod(5);
    test.equal('should never be reached', true);
  } catch (e) {
    test.equal(e.message, '[second err]');
  }

  const events = await getEvents();
  test.equal(events, ['first err', 'first err']);
});

Tinytest.addAsync('methods - global pipeline', async (test) => {
  const result = await globalPipelineMethod(5);
  test.equal(result, 6);
});

Tinytest.addAsync('methods - unnamed method', async (test) => {
  const result = await unnamedMethod(10);
  test.equal(result, 5);
});

if (Meteor.isClient) {
  Tinytest.addAsync('methods - run as stub', async (test) => {
    window.stub = false;
    stubRunMethod(10);
    test.equal(window.stub, true);
  });

  Tinytest.addAsync('methods - stub method', async (test) => {
    window.stub = false;
    stubMethod(10);
    test.equal(window.stub, true);
  });
}
