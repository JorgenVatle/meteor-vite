# Changelog

## 1.0.0
- Make `svelte:compiler` a weak dependency

## 0.3.1
- Allow version 3.31.2 of Svelte dependency

## 0.3.0
- Update Svelte dependency to at least 3.25.0, revert hack from 0.2.3

## 0.2.3
- Implement hack to work around sveltejs/svelte#4899

## 0.2.2
- Support `Tracker.autorun()` inside `onMount()`

## 0.2.1
- Fix bug with nested `Tracker.autorun()` inside `Tracker.nonreactive()`

## 0.2.0
- Support for using `Tracker.autorun()` inside a Svelte `$:` computation
- `useTracker()` is wrapped inside a `Tracker.nonreactive()`

## 0.1.0
- Added `useSession()` for tracking Meteor Session variables

## 0.0.1
- Initial release
