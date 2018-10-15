import Thermo, { delim } from './Thermo';
import { reflect } from './Monad';
import { ListMonad, ListC, list, listProgram } from './List';
import { MaybeMonad, MaybeC, nothing, just, maybeProgram } from './Maybe';
import State, { StateMonad, StateC, get, put, stateProgram } from './State';
import { op, handle, effProgram } from './Eff';
import { Ops, Sig, opT, handleT, effTProgram } from './EffT';

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
const test3 = maybeProgram($ =>
  $(just(1)) + $(nothing<number>()));
console.log(''+test3); // Nothing

// List monad
const test4 = reflect<ListC, number>(ListMonad, $ =>
  $(list(1, 2, 3)) * $(list(4, 5, 6)));
console.log('' + test4); // [ 4, 5, 6, 8, 10, 12, 12, 15, 18 ]
const test4p = listProgram($ =>
  $(list(1, 2, 3)) * $(list(4, 5, 6)));
console.log('' + test4p); // [ 4, 5, 6, 8, 10, 12, 12, 15, 18 ]

// State monad
const test5 = State.from(reflect<StateC<number>, number>(StateMonad<number>(), ($: <R>(val: State<number, R>) => R) =>
  $(get()) + $(get())));
console.log(test5.eval(10)); // 20
const test6 = stateProgram<number>($ => {
  const x = $(get());
  $(put(1));
  return x + $(get());
});
console.log(test6.eval(10)); // 11

// algebraic effects and handlers (with untyped operations)
/*
  x <- flip ();
  y <- flip ();
  return x || y
*/
const test7 = effProgram<boolean>($ => $(op('flip')) || $(op('flip')));
const handled = handle<boolean, boolean>({
  ops: {
    flip: (_, k) => k(Math.random() > 0.5),
  },
}, test7);
console.log(handled); // true OR false

// algebraic effects with typed operations
type Flip = {
  flip: Sig<null, boolean>;
};
const test8 = effTProgram<Flip, boolean>($ => $(opT('flip', null)));
const handled2 = handleT<Flip, boolean, boolean>({
  ops: {
    flip: (v, k) => k(true),
  },
}, test8);
console.log(handled2); // true
