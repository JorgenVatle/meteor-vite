/**
 * This function wraps a Meteor Session variable as a Svelte store.
 */

import { Session } from "meteor/session";
import { EJSON } from "meteor/ejson";

let nextId = 1;

const parse = serialized =>
  (serialized !== undefined && serialized !== 'undefined')
    ? EJSON.parse(serialized)
    : undefined;

export default function useSession(key, defaultValue) {
  if (arguments.length > 1) {
    Session.setDefault(key, defaultValue);
  }

  return {
    subscribe(set) {
      Session._ensureKey(key);
      const dep = Session.keyDeps[key];
      if (Object.prototype.hasOwnProperty.call(Session.keys, key)) {
        set(parse(Session.keys[key]));
      }

      const id = `svelte-session-${nextId++}`;
      dep._dependentsById[id] = {
        _id: id,
        invalidate: () => {
          set(parse(Session.keys[key]));
        },
      };

      return () => {
        delete dep._dependentsById[id];
      };
    },
    set(value) {
      Session.set(key, value);
    },
  };
};
