import { App, Monad } from './Monad';

export type ListC = typeof List;
export type ListA<A> = App<ListC, A>;
export default abstract class List<T> implements App<ListC, T> {

  readonly _con = List;
  readonly _arg = null as unknown as T;

  static from<A>(val: ListA<A>): List<A> {
    return val as List<A>;
  }
  static to<A>(val: List<A>): ListA<A> {
    return val;
  }

  static ret<A>(val: A): List<A> {
    return List.from(ListMonad.ret(val));
  }
  bind<B>(fn: (val: T) => List<B>): List<B> {
    return List.from(ListMonad.bind(this, fn));
  }

  toString(): string {
    let c: List<T> = this;
    const r = [];
    while(c instanceof Cons) {
      r.push(c.head);
      c = c.tail;
    }
    return `[ ${r.join(', ')} ]`;
  }
    
}

export class Nil<T> extends List<T> { }
export const nil = <T>(): List<T> => new Nil<T>();

export class Cons<T> extends List<T> {
  constructor(
    public readonly head: T,
    public readonly tail: List<T>,
  ) { super() }
}
export const cons = <T>(head: T, tail: List<T>): List<T> =>
  new Cons(head, tail);

const append = <T>(a: List<T>, b: List<T>): List<T> =>
  a instanceof Cons? cons(a.head, append(a.tail, b)): b;

const bind = <A, B>(x: List<A>, f: (val: A) => List<B>): List<B> =>
  x instanceof Cons? append(f(x.head), bind(x.tail, f)): nil();

export const ListMonad: Monad<ListC> = {
  ret: x => cons(x, nil()),
  bind,
};

export const listFrom = <T>(a: T[]): List<T> =>
  a.reduceRight((a, b) => cons(b, a), nil<T>());
export const list = <T>(...a: T[]): List<T> => listFrom(a);
