import {
  globalPipelinePub,
  reactiveSubscribe,
  subscribeBasic, subscribeContext, subscribeError, subscribeFailedContext, subscribeFast, subscribePartial, subscribePipeline, subscribeRateLimited, subscribeSlow, unnamedSubscribe
} from './publications/index';
import {
  createPublication
} from 'meteor/zodern:relay';
import { addSelected, getEvents, removeSelected, updateSelected } from './methods/index';

Tinytest.addAsync('publications - basic', (test, done) => {
  let sub = subscribeBasic({
    onReady() {
      sub.stop();
      done();
    }
  });
});

Tinytest.addAsync('publications - error', (test, done) => {
  let sub = subscribeError({
    onStop(err) {
      test.equal(err.message, '[pub err]');
      done();
    }
  });
});

Tinytest.addAsync('publications - args with options', (test, done) => {
  let sub = subscribeBasic(
    'input',
    {
      onReady() {
        sub.stop();
        done();
      }
    });
});

Tinytest.add('publications - config client', async (test) => {
  test.equal(Object.keys(subscribeBasic.config), ['name']);
  test.equal(subscribeBasic.config.name, 'basic');
});

Tinytest.addAsync('publications - rate limit', (test, done) => {
  for (let i = 0; i < 5; i++) {
    subscribeRateLimited();
  }

  subscribeRateLimited({
    onStop(err) {
      test.equal(err.error, 'too-many-requests');
      done()
    }
  });
});

Tinytest.addAsync('publications - async block by default', (test, done) => {
  let order = [];

  subscribeSlow({
    onReady() {
      order.push('slow')
    }
  });

  subscribeFast({
    onReady() {
      order.push('fast');
      test.equal(order, ['slow', 'fast']);
      done();
    }
  });
});

Tinytest.addAsync('publications - error if created on client', (test, done) => {
  try {
    createPublication({
      name: 'test'
    });
  } catch (e) {
    test.equal(e.message, `createPublication should never be called on the client.
Ensure you have @zodern/babel-plugin-meteor-reify configured, or
you are calling createPublication only in files inside a publications directory`);
    done();
  }
});

Tinytest.addAsync('publications - pipeline', (test, done) => {
  let sub = subscribePipeline(
    10,
    {
      async onReady() {
        sub.stop();
        let events = await getEvents();
        test.equal(events, ['input: 10', 'complete: 20'])
        done();
      }
    });
});

Tinytest.addAsync('publications - partial', (test, done) => {
  let sub = subscribePartial(
    3.33,
    {
      async onReady() {
        sub.stop();
        let events = await getEvents();
        test.equal(events, ['complete: 6.7'])
        done();
      }
    });
});

Tinytest.addAsync('publications - context', (test, done) => {
  let sub = subscribeContext(
    3.33,
    {
      async onReady() {
        sub.stop();
        let events = await getEvents();
        test.equal(events, ['result: []'])
        done();
      }
    });
});

Tinytest.addAsync('publications - context onError', (test, done) => {
  let sub = subscribeFailedContext(
    3.33,
    {
     async onStop(err) {
        test.equal(err.message, '[second err]');

        let events = await getEvents();
        test.equal(events, ['first err', 'first err', '[second err]']);
        done();
      }
    });
});

Tinytest.addAsync('publications - global pipeline', (test, done) => {
  let sub = globalPipelinePub(
    10,
    {
      async onReady() {
        sub.stop();
        let events = await getEvents();
        test.equal(events, ['input: 11']);
        done();
      }
    });
});

Tinytest.addAsync('publications - unnamed', (test, done) => {
  let sub = unnamedSubscribe(
    {
      async onReady() {
        sub.stop();
        done();
      }
    });
});

let Numbers = new Mongo.Collection('numbers');

Tinytest.addAsync('publications - reactive - basic', (test, done) => {
  async function checkPublished(expected) {
    let attempts = 0;
    let published;

    // Wait until sub sends changes
    while (attempts < 5) {
      published = Numbers.find().fetch().map(s => s.num);
      if (
        published.length === expected.length &&
        published.every((v, index) => v === expected[index])
      ) {
        break;
      }
      attempts += 1;
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    test.equal(published, expected);
  }
  async function ready() {
    await checkPublished([]);
    let id = await addSelected(5);
    await checkPublished([5]);
    await addSelected(6);
    await checkPublished([5, 6]);
    await updateSelected({ id, num: 7 });
    await checkPublished([6, 7]);
    await removeSelected(id);
    await checkPublished([6]);
    let events = await getEvents();
    test.equal(events, [
      "Run Selectors step",
      "Selected: ",
      "Selected: 5 - 5",
      "Selected: 5 - 5, 6 - 6",
      "Selected: 6 - 6, 5 - 7",
      "Selected: 6 - 6"
    ]);
    sub.stop();
    done();
  }

  let sub = reactiveSubscribe({ onReady: ready });
});
