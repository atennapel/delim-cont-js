import { delim } from './Thermo';
import { reflect } from './Monad';
import { MaybeMonad, MaybeC, nothing, just } from './Maybe';
import { ListMonad, ListC, list } from './List';
import State, { StateMonad, StateC, get, put } from './State';
import Eff, { EffMonad, EffC, ret, op, handle } from './Eff';

const test = 1 + delim<number>(shift => 2 * shift(k => k(10)));
console.log(test); // 21

const test2 = reflect<MaybeC, number>(MaybeMonad, $ =>
  $(just(1)) + $(just(2)));
console.log(''+test2); // Just(3)
const test3 = reflect<MaybeC, number>(MaybeMonad, $ =>
  $(just(1)) + $(nothing<number>()));
console.log(''+test3); // Nothing

const test4 = reflect<ListC, number>(ListMonad, $ =>
  $(list(1, 2, 3)) * $(list(4, 5, 6)));
console.log('' + test4); // [ 4, 5, 6, 8, 10, 12, 12, 15, 18 ]

const test5 = State.from(reflect<StateC<number>, number>(StateMonad<number>(), ($: <R>(val: State<number, R>) => R) =>
  $(get()) + $(get())));
console.log(test5.eval(10)); // 20
const test6 = State.from(reflect<StateC<number>, number>(StateMonad<number>(), ($: <R>(val: State<number, R>) => R) => {
  const x = $(get());
  $(put(1));
  return x + $(get());
}));
console.log(test6.eval(10)); // 11

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
