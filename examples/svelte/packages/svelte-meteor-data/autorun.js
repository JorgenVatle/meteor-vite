/**
 * Makes Tracker.autorun() computations automatically stop when the component is
 * destroyed, or, if run from a reactive Svelte computation, when the update
 * function is run again.
 */

import { Tracker } from 'meteor/tracker';
import { current_component, schedule_update, dirty_components } from 'svelte/internal';


const _autorun = Tracker.autorun;
const _nonreactive = Tracker.nonreactive;

function svelteAwareAutorun(f, options) {
  const component = current_component;
  const computation = _autorun.apply(this, arguments);
  if (component) {
    // We're inside a Svelte component.  We have to stop the computation when
    // the component is destroyed.
    _autoStopComputation(computation, component);
  }
  return computation;
}

Tracker.autorun = svelteAwareAutorun;

Tracker.nonreactive = function nonreactive(f) {
  if (current_component) {
    // A Tracker.autorun inside a Tracker.nonreactive should behave normally,
    // without the special Svelte stuff.
    const prevAutorun = Tracker.autorun;
    Tracker.autorun = _autorun;
    try {
      return _nonreactive.apply(this, arguments);
    } finally {
      Tracker.autorun = prevAutorun;
    }
  } else {
    return _nonreactive.apply(this, arguments);
  }
};

function _autoStopComputation(computation, component) {
  const $$ = component.$$;
  $$.on_destroy.push(computation.stop.bind(computation));
  if (!$$.ctx) {
    // We're in initialization, so nothing else to do.
    return;
  }

  if ($$.fragment && $$.dirty[0] === -1) {
    // We have a fragment, but it's set to the initial dirty state, so we must
    // be in on onMount or so.  Don't do anything special, then.
    return;
  }

  // We are in a reactive Svelte update.  That means that we'll need to stop the
  // computation the next time that it is run.  But we don't know when that is,
  // because the next update may or may not hit this autorun again, depending on
  // the dirty flags.
  // So, we simply stop all computations the next time that the update is run,
  // but we keep listening for invalidations, so that if one of them becomes
  // invalid, we can force Svelte to re-run the updates to make it hit the
  // autorun again.

  // But first, remember which dirty flags made this autorun trigger, so that we
  // can reuse these bits to force Svelte to re-hit the autorun.
  // This will unfortunately most of the time be all bits set, since the first
  // time it is called is usually during initialization.  But if the autorun is
  // first enabled by a Svelte variable change, it will be a bit more efficient.
  computation._savedDirty = [...$$.dirty];

  if ($$._stopComputations) {
    $$._stopComputations.push(computation);
    return;
  }

  $$._stopComputations = [computation];

  // Temporary hook around the update function so that it stops our computation
  // the next time it is called.
  const _update = $$.update;
  $$.update = () => {
    // Optimization: are we about to rerun everything?  If so, don't bother with
    // onInvalidate, just stop the computations right here.
    if ($$.dirty.every(d => (d === 0x7fffffff))) {
      $$._stopComputations.forEach(comp => comp.stop());
    } else {
      // Otherwise, we are not sure whether all the autorun blocks will run
      // again, so we prevent the computations from continuing to run, but will
      // continue to watch it for changes.  If there is a change, we require the
      // update to be run again.
      for (const comp of $$._stopComputations) {
        comp.stopped = true;
        comp.onInvalidate(() => {
          if ($$.dirty[0] === -1) {
            // We're the first to mark it dirty since the last update.
            dirty_components.push(component);
            schedule_update();
            $$.dirty.fill(0);
          }
          comp._savedDirty.forEach((mask, i) => {
            $$.dirty[i] |= mask & 0x7fffffff;
          });
        });
      }
    }

    // Leave everything as it was, so that the overhead is removed if the
    // Tracker.autorun was under a condition that has now becomes false.
    delete $$._stopComputations;
    $$.update = _update;
    return _update();
  };
}
