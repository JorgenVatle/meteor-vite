/**
 * This function wraps a reactive Meteor computation as a Svelte store.
 */

const nonreactive = Tracker.nonreactive;
const autorun = Tracker.autorun;

export default function useTracker(reactiveFn) {
  return {
    subscribe(set) {
      return nonreactive(() => {
        const computation = autorun(() => set(reactiveFn()));
        return computation.stop.bind(computation);
      });
    },
  };
};
