/**
 * Implements the Svelte store contract for MongoDB cursors.
 */

import { Mongo } from 'meteor/mongo';

Mongo.Cursor.prototype.subscribe = function(set) {
  // Set the initial result directly, without going through the callbacks
  const mapFn = this._transform
    ? element => this._transform(this._projectionFn(element))
    : element => this._projectionFn(element);

  let result = this._getRawObjects({ordered: true}).map(mapFn);

  const handle = this.observe({
    _suppress_initial: true,
    addedAt: (doc, i) => {
      result = [...result.slice(0, i), doc, ...result.slice(i)];
      set(result);
    },
    changedAt: (doc, old, i) => {
      result = [...result.slice(0, i), doc, ...result.slice(i + 1)];
      set(result);
    },
    removedAt: (old, i) => {
      result = [...result.slice(0, i), ...result.slice(i + 1)];
      set(result);
    },
    movedTo: (doc, from, to) => {
      result = [...result.slice(0, from), ...result.slice(from + 1)];
      result.splice(to, 0, doc);
      set(result);
    },
  });

  set(result);
  return handle.stop.bind(this);
};
