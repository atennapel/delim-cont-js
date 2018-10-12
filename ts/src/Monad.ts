import Thermo from './Thermo';

export interface App<C, A> {
  readonly _con: C;
  readonly _arg: A;
}

export interface Monad<C> {
  ret<A>(val: A): App<C, A>;
  bind<A, B>(val: App<C, A>, fn: (val: A) => App<C, B>): App<C, B>
}

export class Represent<C> {
  private readonly thermo = new Thermo<App<C, any>, any>();

  constructor(private readonly m: Monad<C>) { }

  reflect<A>(x: App<C, A>): A {
    return this.thermo.shift(k => this.m.bind<A, A>(x, k));
  }
  reify<A>(f: (fn: <R>(val: App<C, R>) => R) => A): App<C, A> {
    return this.m.bind(this.thermo.reset(() =>
      this.m.ret(f(x => this.reflect(x)))), this.m.ret);
  }
}

export const reflect = <C, A>(m: Monad<C>, f: (fn: <R>(val: App<C, R>) => R) => A): App<C, A> => {
  const r = new Represent<C>(m);
  return r.reify(f);
}
