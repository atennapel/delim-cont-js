import Thermo from './Thermo';

export interface App<C, A> {
  readonly _con: C;
  readonly _arg: A;
}

export interface Monad<C> {
  ret<A>(val: A): App<C, A>;
  bind<A, B>(val: App<C, A>, fn: (val: A) => App<C, B>): App<C, B>
}

export class Represent<C, A> {
  private readonly thermo = new Thermo<App<C, A>, A>();

  constructor(private readonly m: Monad<C>) { }

  reflect(x: App<C, A>): A {
    return this.thermo.shift(k => this.m.bind<A, A>(x, k));
  }
  reify(f: (fn: (val: App<C, A>) => A) => A): App<C, A> {
    return this.m.bind(this.thermo.reset(() =>
      this.m.ret(f(x => this.reflect(x)))), this.m.ret);
  }
}

export const reflect = <C, A>(m: Monad<C>, f: (fn: (val: App<C, A>) => A) => A): App<C, A> => {
  const r = new Represent<C, A>(m);
  return r.reify(f);
}
