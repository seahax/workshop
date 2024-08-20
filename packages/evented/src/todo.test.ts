import { expect, test, vitest } from 'vitest';

import { Evented } from './index.js';

test('do the thing', () => {
  const myClass = new MyClass();
  const onFoo = vitest.fn();
  const onBar = vitest.fn();
  const offFoo = myClass.on('foo', onFoo);
  const offBar = myClass.on('bar', onBar);

  myClass.emit('foo', 'hello');
  myClass.emit('bar', 42, 'world');
  expect(onFoo).toHaveBeenCalledTimes(1);
  expect(onFoo).toHaveBeenLastCalledWith('hello');
  expect(onBar).toHaveBeenCalledTimes(1);
  expect(onBar).toHaveBeenLastCalledWith(42, 'world');

  offFoo();
  offBar();

  myClass.emit('foo', 'goodbye');
  myClass.emit('bar', 24, 'dream');
  expect(onFoo).toHaveBeenCalledTimes(1);
  expect(onBar).toHaveBeenCalledTimes(1);
});

class MyClass extends Evented<{ foo: (foo: string) => void; bar: (bar: number, arg: string) => void }> {}
