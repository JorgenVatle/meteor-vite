import { Tinytest } from "meteor/tinytest";
import { ReactiveVar } from 'meteor/reactive-var';

import './reactive-var';


Tinytest.add('ReactiveVar store contract', function (test) {
  const rvar = new ReactiveVar("initial");

  let setterCalled = 0;
  let setterCalledWith;

  function setter(value) {
    setterCalled += 1;
    setterCalledWith = value;
  }

  const unsub = rvar.subscribe(setter);
  test.equal(setterCalled, 1, 'Subscribe should have called setter once');
  test.equal(setterCalledWith, "initial", 'Subscribe should have set initial value');

  rvar.set("initial");
  test.equal(setterCalled, 1, 'Setter should not be called if value is not changed');

  rvar.get();
  test.equal(setterCalled, 1, 'Setter should not be called on ReactiveVar.get()');

  rvar.set("new");
  test.equal(setterCalled, 2, 'Setter should be called if value is changed');
  test.equal(setterCalledWith, "new", 'Setter should be called with new value');

  unsub();

  test.equal(setterCalled, 2, 'Unsubscribe should not call setter');

  rvar.set("newer");
  test.equal(setterCalled, 2, 'Setter may not be called after unsubscribe');
});
