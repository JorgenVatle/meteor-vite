/**
 * Overrides Meteor.subscribe to do the following things:
 * - Automatically stops the subscription when the component is destroyed
 * - Makes the return value usable in {#await} blocks
 */

import { current_component } from 'svelte/internal';


_subscribe = Meteor.subscribe;
Meteor.subscribe = function subscribe(name) {
  const params = Array.from(arguments);
  let callbacks = Object.create(null);
  if (params.length > 1) {
    // Preserve existing callbacks.
    const last = params[params.length - 1];
    if (last) {
      // Last arg may be specified as a function, or as an object
      if (typeof last === 'function') {
        callbacks.onReady = params.pop();
      } else if ([last.onReady, last.onError, last.onStop].some(f => typeof f === "function")) {
        callbacks = params.pop();
      }
    }
  }
  params.push(callbacks);

  let subscription;

  // Collect callbacks to call when subscription is ready or has errored.
  let readyCallbacks = [];
  let errorCallbacks = [];
  if (callbacks.onReady) {
    readyCallbacks.push(callbacks.onReady);
  }
  if (callbacks.onError) {
    errorCallbacks.push(callbacks.onError);
  }
  callbacks.onReady = () => {
    readyCallbacks.forEach(fn => fn(subscription));
    readyCallbacks.length = 0;
  };
  callbacks.onError = (err) => {
    errorCallbacks.forEach(fn => fn(err));
    errorCallbacks.length = 0;
  };

  subscription = _subscribe.apply(this, params);
  if (current_component) {
    current_component.$$.on_destroy.push(subscription.stop.bind(subscription));
  }
  subscription.then = (fn, err) => {
    if (subscription.ready()) {
      fn();
    } else {
      readyCallbacks.push(fn);
      err && errorCallbacks.push(err);
    }
  };
  return subscription;
};
