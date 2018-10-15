import { App, Monad, reflect } from './Monad';

export type Sig<A, B> = { paramty: A, returnty: B };
export type Ops = { [key: string]: Sig<any, any> };

export type EffTC<O extends Ops> = { con: typeof EffT, arg: O };
export type EffTA<O extends Ops, A> = App<EffTC<O>, A>;
export default abstract class EffT<O extends Ops, T> implements App<EffTC<O>, T> {

  readonly _con = { con: EffT, arg: null as unknown as O };
  readonly _arg = null as unknown as T;

  static from<O extends Ops, A>(val: EffTA<O, A>): EffT<O, A> {
    return val as EffT<O, A>;
  }
  static to<O extends Ops, A>(val: EffT<O, A>): EffTA<O, A> {
    return val;
  }

  static ret<O extends Ops, A>(val: A): EffT<O, A> {
    return EffT.from(EffTMonad<O>().ret(val));
  }
  bind<B>(fn: (val: T) => EffT<O, B>): EffT<O, B> {
    return EffT.from(EffTMonad<O>().bind(this, fn));
  }

  toString(): string {
    return this instanceof BindT? `(${this.c1}; ...)`: this instanceof OpT? `${this.op.toString()}(${this.val})`: `Return(${(this as any).val})`;
  }
    
}

export class ReturnT<O extends Ops, T> extends EffT<O, T> { constructor(public readonly val: T) { super() } }
export const retT = <O extends Ops, T>(val: T): EffT<O, T> => new ReturnT<O, T>(val);

export class OpT<O extends Ops, K extends keyof O, T> extends EffT<O, T> { constructor(public readonly op: K, public readonly val: O[K]['paramty']) { super() } }
export const opT = <O extends Ops, K extends keyof O, T>(o: K, v: O[K]['paramty']): EffT<O, T> => new OpT<O, K, T>(o, v);

export class BindT<O extends Ops, A, T> extends EffT<O, T> { constructor(
  public readonly c1: EffT<O, A>,
  public readonly then: (val: A) => EffT<O, T>,
) { super() } }

export const EffTMonad = <O extends Ops>(): Monad<EffTC<O>> => ({
  ret: <T>(x: T) => new ReturnT<O, T>(x),
  bind: <A, T>(val: any, fn: any) => new BindT<O, A, T>(val as any, fn as any),
});

export interface HandlerT<O extends Ops, T, R> {
  return?: (val: T) => R;
  ops: { [k in keyof O]: (v: O[k]['paramty'], k: (val: O[k]['returnty']) => R) => R };
}

export const handleT = <O extends Ops, T, R>(h: HandlerT<O, T, R>, e: EffT<O, T> | App<EffTC<O>, T>): R => {
  if(e instanceof ReturnT) return h.return? h.return(e.val): e.val;
  if(e instanceof OpT) throw new Error('unable to handle ' + e.op.toString());
  if(e instanceof BindT) {
    if(e.c1 instanceof ReturnT) {
      return handleT(h, e.then(e.c1.val));
    } else if(e.c1 instanceof OpT) {
      if(h.ops[e.c1.op.toString()]) {
        return h.ops[e.c1.op.toString()](e.c1.val, (v: any) => handleT(h, e.then(v)));
      } else throw new Error('unable to handle ' + e.c1.op.toString());
    } else if(e.c1 instanceof BindT) {
      return handleT(h, e.then(handleT(h, e.c1)));
    }
  }
  throw new Error('impossible');
};

export const effTProgram = <O extends Ops, T>(f: (fn: <R>(val: EffT<O, R>) => R) => T): EffT<O, T> =>
  EffT.from(reflect<EffTC<O>, T>(EffTMonad<O>(), f));
