import { App, Monad, reflect } from './Monad';

export type EffC = typeof Eff;
export type EffA<A> = App<EffC, A>;
export default abstract class Eff<T> implements App<EffC, T> {

  readonly _con = Eff;
  readonly _arg = null as unknown as T;

  static from<A>(val: EffA<A>): Eff<A> {
    return val as Eff<A>;
  }
  static to<A>(val: Eff<A>): EffA<A> {
    return val;
  }

  static ret<A>(val: A): Eff<A> {
    return Eff.from(EffMonad.ret(val));
  }
  bind<B>(fn: (val: T) => Eff<B>): Eff<B> {
    return Eff.from(EffMonad.bind(this, fn));
  }

  toString(): string {
    return this instanceof Bind? `(${this.c1}; ...)`: this instanceof Op? `${this.op}(${this.val})`: `Return(${(this as any).val})`;
  }
    
}

export class Return<T> extends Eff<T> { constructor(public readonly val: T) { super() } }
export const ret = <T>(val: T): Eff<T> => new Return<T>(val);

export class Op<T> extends Eff<T> { constructor(public readonly op: string, public readonly val?: any) { super() } }
export const op = <T>(o: string, v?: any): Op<T> => new Op<T>(o, v);

export class Bind<A, T> extends Eff<T> { constructor(
  public readonly c1: Eff<A>,
  public readonly then: (val: A) => Eff<T>,
) { super() } }

export const EffMonad: Monad<EffC> = {
  ret: x => new Return(x),
  bind: (val, fn) => new Bind(val as any, fn as any),
};

export interface Handler<T, R> {
  return?: (val: T) => R;
  ops: { [key: string]: (v: any, k: (val: any) => R) => R };
}

export const handle = <T, R>(h: Handler<T, R>, e: Eff<T> | App<EffC, T>): R => {
  if(e instanceof Return) return h.return? h.return(e.val): e.val;
  if(e instanceof Op) throw new Error('unable to handle ' + e.op);
  if(e instanceof Bind) {
    if(e.c1 instanceof Return) {
      return handle(h, e.then(e.c1.val));
    } else if(e.c1 instanceof Op) {
      if(h.ops[e.c1.op]) {
        return h.ops[e.c1.op](e.c1.val, (v: any) => handle(h, e.then(v)));
      } else throw new Error('unable to handle ' + e.c1.op);
    } else if(e.c1 instanceof Bind) {
      return handle(h, e.then(handle(h, e.c1)));
    }
  }
  throw new Error('impossible');
};

export const effProgram = <T>(f: (fn: <R>(val: Eff<R>) => R) => T): Eff<T> =>
  Eff.from(reflect<EffC, T>(EffMonad, f));
