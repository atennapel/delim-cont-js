type Cont<A, R> = (fn: (val: R) => A) => A;
type Reset<A, R> = (f: Cont<A, R>) => R;
type Thunk<A, R> = (f: Reset<A, R>) => A;

class Frame<T> {}
class Return<T> extends Frame<T> { constructor(public readonly val: T) { super() } }
class Enter<T> extends Frame<T> {}

class Done<T> { constructor(public readonly ans: T) { } }

class ResetState<T, R> {
  constructor(
    public readonly block: Thunk<T, R> | null,
    public readonly past: Frame<R>[],
    public readonly future: Frame<R>[],
  ) { }
}

export default class Thermo<A, R = A> {

  private past: Frame<R>[] = [];
  private future: Frame<R>[] = [];
  private readonly nest: ResetState<A, R>[] = [];
  private curExpr: Thunk<A, R> | null = null;

  runWithFuture(f: Thunk<A, R>, fFuture: Frame<R>[]): A {
    this.nest.push(new ResetState(this.curExpr, this.past, this.future));
    this.past = [];
    this.future = fFuture.slice(0);
    this.curExpr = f;

    let result: A;
    try {
      result = f((x: Cont<A, R>) => this.shift(x));
    } catch(d) {
      if(d instanceof Done) {
        result = d.ans as A;
      } else throw d;
    }

    const prev = this.nest.pop() as ResetState<A, R>;
    this.curExpr = prev.block;
    this.past = prev.past;
    this.future = prev.future;

    return result;
  }

  reset(block: Thunk<A, R>): A {
    return this.runWithFuture(block, []);
  }

  tryPop<T>(s: T[]): T | null {
    return s.length === 0? null: s.pop() || null;
  }

  shift(f: Cont<A, R>): R {
    const fr = this.tryPop(this.future);
    if(fr instanceof Return) {
      this.past.push(fr);
      return fr.val as R;
    } else if(!fr || fr instanceof Enter) {
      const newFuture = this.past.slice(0).reverse();
      const ourExpr = this.curExpr;
      if(!ourExpr) throw new Error('thunk is null');
      const k = (v: R): A => {
        const fut = newFuture.slice(0);
        fut.unshift(new Return(v));
        return this.runWithFuture(ourExpr, fut);
      };
      this.past.push(new Enter());
      const result = f(k);
      throw new Done(result);
    } else throw new Error('invalid value in future');
  }

}

export const delim = <A, R = A>(f: Thunk<A, R>): A => {
  const d = new Thermo<A, R>();
  return d.reset(f);
}
