/**
 * Makes ReactiveVar behave as a Svelte store.
 */

import { ReactiveVar } from 'meteor/reactive-var';

let nextId = 1;

ReactiveVar.prototype.subscribe = function subscribe(set) {
  const value = this.curValue;
  if (value !== undefined) {
    set(value);
  }
  const id = `svelte-${nextId++}`;
  this.dep._dependentsById[id] = {
    _id: id,
    invalidate: () => {
      set(this.curValue);
    },
  };
  return () => {
    delete this.dep._dependentsById[id];
  };
};
