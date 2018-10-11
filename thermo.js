class Return {
  constructor(val) {
    this.val = val;
  }
}
class Enter {}

class Done {
  constructor(ans) {
    this.ans = ans;
  }
}

class ResetState {
  constructor(block, past, future) {
    this.block = block;
    this.past = past;
    this.future = future;
  }
}

class Thermo {
  
  constructor() {
    this.past = [];
    this.future = [];
    this.nest = [];
    this.curExpr = null;
  }

  runWithFuture(f, fFuture) {
    this.nest.push(new ResetState(this.curExpr, this.past, this.future));
    this.past = [];
    this.future = fFuture.slice(0);
    this.curExpr = f;

    let result;
    try {
      result = f(x => this.shift(k => k(x)), x => this.shift(x));
    } catch(d) {
      if(d instanceof Done) {
        result = d.ans;
      } else throw d;
    }

    const prev = this.nest.pop();
    this.curExpr = prev.block;
    this.past = prev.past;
    this.future = prev.future;

    return result;
  }

  reset(block) {
    return this.runWithFuture(block, []);
  }

  tryPop(s) {
    return s.length === 0? null: s.pop();
  }

  shift(f) {
    const fr = this.tryPop(this.future);
    if(fr instanceof Return) {
      this.past.push(fr);
      return fr.val;
    } else if(!fr || fr instanceof Enter) {
      const newFuture = this.past.slice(0).reverse();
      const ourExpr = this.curExpr;
      const k = v => {
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

class Represent {
  constructor(ret, bind) {
    this.c = new Thermo();
    this.ret = ret;
    this.bind = bind;
  }

  reflect(x) {
    return c.shift(k => this.bind(x, k));
  }
  reify(f) {
    return this.bind(c.reset(() => this.ret(f(x => this.reflect(x)))), this.ret);
  }
}

const arrBind = (l, f) => {
  const r = [];
  for(let i = 0; i < l.length; i++) {
    const n = f(l[i]);
    for(let j = 0; j < n.length; j++) {
      r.push(n[j]);
    }
  }
  return r;
};

const delim = f => {
  const d = new Thermo();
  return d.reset(f);
}

// Delimited continuations
const c = new Thermo();
const test = 1 + c.reset(() => 2 * c.shift(k => k(10)));
console.log(test); // 21

// Simple delimited continuations
const test_simple = 1 + delim(call => 2 * call(10));
console.log(test_simple); // 21
const test_simple2 = 1 + delim((_, shift) => 2 * shift(k => k(10)));
console.log(test_simple2); // 21

// Nondeterminism (List monad)
const n = new Represent(x => [x], arrBind);
const test2 = n.reify($ => $([1, 2, 3]) * $([4, 5, 6]));
console.log(test2); // [ 4, 5, 6, 8, 10, 12, 12, 15, 18 ]

// Optional (Maybe monad)
const maybeBind = (m, f) => m === null? m: f(m);
const m = new Represent(x => x, maybeBind);
const test3 = m.reify($ => $(3) + $(2) * $(4));
console.log(test3); // 11
const test4 = m.reify($ => $(3) + $(null) * $(4));
console.log(test4); // null

// Mutable state (State monad)
const stateRet = x => s => [x, s];
const stateBind = (x, f) => s => {
  const [iv, is] = x(s);
  return f(iv)(is);
};
const get = s => [s, s];
const put = x => s => [null, x];
const modify = f => s => [f(s), s];
const st = new Represent(stateRet, stateBind);
const test5 = st.reify($ => $(get) + $(get)); // x <- get; y <- get; return x + y
console.log(test5(10)); // [ 20, 10 ]
const test6 = st.reify($ => {
  const x = $(get);
  $(put(100));
  return x + $(get);
}); // x <- get; put 100; y <- get; return x + y
console.log(test6(10)); // [ 110, 100 ]
