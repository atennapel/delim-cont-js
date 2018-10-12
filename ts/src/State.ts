import { App, Monad } from './Monad';

export type StateP<S, T> = { state: S, val: T };
export type StateF<S, T> = (st: S) => StateP<S, T>;

export type StateC<S> = { con: typeof State, arg: S };
export type StateA<S, A> = App<StateC<S>, A>;
export default class State<S, T> implements App<StateC<S>, T> {

  readonly _con = { con: State, arg: null as unknown as S };
  readonly _arg = null as unknown as T;

  constructor(private readonly fn: StateF<S, T>) { }

  static from<S, A>(val: StateA<S, A>): State<S, A> {
    return val as State<S, A>;
  }
  static to<S, A>(val: State<S, A>): StateA<S, A> {
    return val;
  }

  run(st: S): StateP<S, T> {
    return this.fn(st);
  }
  eval(st: S): T {
    return this.fn(st).val;
  }

  static ret<S, A>(val: A): State<S, A> {
    return State.from(StateMonad<S>().ret(val));
  }
  bind<B>(fn: (val: T) => State<S, B>): State<S, B> {
    return State.from(StateMonad<S>().bind(this, fn));
  }

  toString(): string {
    return `State`;
  }
    
}

export const state = <S, A>(fn: StateF<S, A>): State<S, A> => new State<S, A>(fn);

export const StateMonad = <S>(): Monad<StateC<S>> => ({
  ret: <S, A>(val: A) => state<S, A>(state => ({ state, val })) as App<StateC<S>, A>,
  bind: <A, B>(x: State<S, A>, fn: (val: A) => State<S, B>): State<S, B> => state((s: S) => {
    const { state, val } = x.run(s);
    return fn(val).run(state);
  }),
});

export const get = <S>() =>
  state<S, S>(s => ({ state: s, val: s }));
export const put = <S>(s: S) =>
  state<S, null>(_ => ({ state: s, val: null }));
export const modify = <S>(fn: (val: S) => S) =>
  state<S, S>(s => {
    const x = fn(s);
    return { state: x, val: x };
  });
