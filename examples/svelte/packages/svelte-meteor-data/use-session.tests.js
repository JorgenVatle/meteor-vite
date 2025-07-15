import { Tinytest } from "meteor/tinytest";
import { Session } from "meteor/session";

import { default as useSession } from './use-session';


Tinytest.add('useSession default value', function (test) {
  Session.delete('test1');

  useSession('test1');

  test.isFalse(Object.prototype.hasOwnProperty.call(Session.keys, 'test1'),
               'Should not set default value without second arg');

  useSession('test2', 'value1')
  test.equal(Session.keys['test2'], '"value1"',
             'Should set default value with second arg');

  useSession('test2', 'value2');
  test.equal(Session.keys['test2'], '"value1"',
             'Second arg should not overwrite existing set value');

  useSession('test2');
  test.equal(Session.keys['test2'], '"value1"',
             'Undefined second arg should overwrite existing value');
});


Tinytest.add('useSession reactivity', function (test) {
  Session.delete('test3');

  const store = useSession('test3', 'initial');

  let setterCalled = 0;
  let setterCalledWith;

  function setter(value) {
    setterCalled += 1;
    setterCalledWith = value;
  }

  const unsub = store.subscribe(setter);
  test.equal(setterCalled, 1, 'Subscribe should have called setter once');
  test.equal(setterCalledWith, "initial", 'Subscribe should have set initial value');

  store.set("initial");
  test.equal(setterCalled, 1, 'Setter should not be called if value is not changed');

  Session.set("test3", "initial");
  test.equal(setterCalled, 1, 'Setter should not be called if value is not changed via Session');

  Session.get("test3");
  test.equal(setterCalled, 1, 'Setter should not be called on Session.get()');

  store.set("new");
  test.equal(setterCalled, 2, 'Setter should be called if value is changed via set()');
  test.equal(setterCalledWith, "new", 'Setter should be called with new value on set()');

  Session.set("test3", "newer");
  test.equal(setterCalled, 3, 'Setter should be called if value is changed via Session.set()');
  test.equal(setterCalledWith, "newer", 'Setter should be called with new value on Session.set()');

  unsub();

  test.equal(setterCalled, 3, 'Unsubscribe should not call setter');

  store.set("newest");
  test.equal(setterCalled, 3, 'Setter may not be called after unsubscribe');

  Session.set("test3", "newest");
  test.equal(setterCalled, 3, 'Setter may not be called after unsubscribe');
});
