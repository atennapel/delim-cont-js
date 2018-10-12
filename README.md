# delim-cont-js
Implementation of the delimited continuations (called "Thermometer Continuations") from the paper "Capturing the Future by Replaying the Past" in Javascript. <br/>

Translated from: https://github.com/jkoppel/thermometer-continuations <br/>
The paper: https://arxiv.org/abs/1710.10385

Todo:
* Improve type inference somehow
* More examples
* Implement algebraic effects in Javascript
* Improve Typescript algebraic effects

## Javascript examples
```javascript
const {
  Thermo,
  Represent,
  delim,
  Monad,
  reflect,
} = require('./thermo');

// Monads
const arrBind = (l, f) => {
  const r = [];
  for(let i = 0; i < l.length; i++) {
    const n = f(l[i]);
    for(let j = 0; j < n.length; j++) {
      r.push(n[j]);
    }
  }
  return r;
};

const arrMonad = Monad(x => [x], arrBind);
const maybeMonad = Monad(x => x, (m, f) => m === null? m: f(m));

const stateRet = x => s => [x, s];
const stateBind = (x, f) => s => {
  const [iv, is] = x(s);
  return f(iv)(is);
};
const get = s => [s, s];
const put = x => s => [null, x];
const modify = f => s => [f(s), s];
const st = new Represent(stateRet, stateBind);

const stateMonad = Monad(stateRet, stateBind);

// Delimited continuations
const c = new Thermo();
const test = 1 + c.reset(() => 2 * c.shift(k => k(10)));
console.log(test); // 21

// Simple delimited continuations
const test_simple = 1 + delim((_, call) => 2 * call(10));
console.log(test_simple); // 21
const test_simple2 = 1 + delim(shift => 2 * shift(k => k(10)));
console.log(test_simple2); // 21
const test_simple3 = 1 + delim(shift => 2 * shift(k => 10));
console.log(test_simple3); // 11

// Nondeterminism (List monad)
const test2 = reflect(arrMonad, $ => $([1, 2, 3]) * $([4, 5, 6]));
console.log(test2); // [ 4, 5, 6, 8, 10, 12, 12, 15, 18 ]

// Optional (Maybe monad)
const test3 = reflect(maybeMonad, $ => $(3) + $(2) * $(4));
console.log(test3); // 11
const test4 = reflect(maybeMonad, $ => $(3) + $(null) * $(4));
console.log(test4); // null

// Mutable state (State monad)
const test5 = reflect(stateMonad, $ => $(get) + $(get)); // x <- get; y <- get; return x + y
console.log(test5(10)); // [ 20, 10 ]
const test6 = reflect(stateMonad, $ => {
  const x = $(get);
  $(put(100));
  return x + $(get);
}); // x <- get; put 100; y <- get; return x + y
console.log(test6(10)); // [ 110, 100 ]
```

## Typescript examples
```typescript
import Thermo, { delim } from './Thermo';
import { reflect } from './Monad';
import { MaybeMonad, MaybeC, nothing, just } from './Maybe';
import { ListMonad, ListC, list } from './List';
import State, { StateMonad, StateC, get, put } from './State';
import { EffMonad, EffC, ret, op, handle } from './Eff';

// Delimited continuations
const c = new Thermo<number>();
const test = 1 + c.reset(() => 2 * c.shift(k => k(10)));
console.log(test); // 21

// Simple delimited continuations
const test_simple = 1 + delim<number>((_, call) => 2 * call(10));
console.log(test_simple); // 21
const test_simple2 = 1 + delim<number>(shift => 2 * shift(k => k(10)));
console.log(test_simple2); // 21
const test_simple3 = 1 + delim<number>(shift => 2 * shift(k => 10));
console.log(test_simple3); // 11

// Maybe monad
const test2 = reflect<MaybeC, number>(MaybeMonad, $ =>
  $(just(1)) + $(just(2)));
console.log(''+test2); // Just(3)
const test3 = reflect<MaybeC, number>(MaybeMonad, $ =>
  $(just(1)) + $(nothing<number>()));
console.log(''+test3); // Nothing

// List monad
const test4 = reflect<ListC, number>(ListMonad, $ =>
  $(list(1, 2, 3)) * $(list(4, 5, 6)));
console.log('' + test4); // [ 4, 5, 6, 8, 10, 12, 12, 15, 18 ]

// State monad
const test5 = State.from(reflect<StateC<number>, number>(StateMonad<number>(), ($: <R>(val: State<number, R>) => R) =>
  $(get()) + $(get())));
console.log(test5.eval(10)); // 20
const test6 = State.from(reflect<StateC<number>, number>(StateMonad<number>(), ($: <R>(val: State<number, R>) => R) => {
  const x = $(get());
  $(put(1));
  return x + $(get());
}));
console.log(test6.eval(10)); // 11

// algebraic effects and handlers (with untyped operations)
/*
  x <- get ();
  y <- get ();
  return x + y + 1
*/
const test7 = reflect<EffC, number>(EffMonad, $ =>
  $(op<number>('get', {})) + $(op<number>('get', {})) + $(ret(1)));
const handled = handle<number, number>({
  ops: {
    get: (v: {}, k: (val: number) => any) => k(10),
  },
}, test7);
console.log(handled); // 21
```
