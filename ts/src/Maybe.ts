import { App, Monad, reflect } from './Monad';

export type MaybeC = typeof Maybe;
export type MaybeA<A> = App<MaybeC, A>;
export default abstract class Maybe<T> implements App<MaybeC, T> {

  readonly _con = Maybe;
  readonly _arg = null as unknown as T;

  static from<A>(val: MaybeA<A>): Maybe<A> {
    return val as Maybe<A>;
  }
  static to<A>(val: Maybe<A>): MaybeA<A> {
    return val;
  }

  static ret<A>(val: A): Maybe<A> {
    return Maybe.from(MaybeMonad.ret(val));
  }
  bind<B>(fn: (val: T) => Maybe<B>): Maybe<B> {
    return Maybe.from(MaybeMonad.bind(this, fn));
  }

  toString(): string {
    return this instanceof Just? `Just(${this.val})`: `Nothing`;
  }
    
}

export class Nothing<T> extends Maybe<T> { }
export const nothing = <T>(): Maybe<T> => new Nothing<T>();

export class Just<T> extends Maybe<T> {
  constructor(public readonly val: T) { super() }
}
export const just = <T>(t: T): Maybe<T> => new Just(t);

export const MaybeMonad: Monad<MaybeC> = {
  ret: just,
  bind: (val, fn) => val instanceof Just? fn(val.val): nothing(),
};

export const maybeProgram = <T>(f: (fn: <R>(val: Maybe<R>) => R) => T): Maybe<T> =>
  Maybe.from(reflect<MaybeC, T>(MaybeMonad, f));
