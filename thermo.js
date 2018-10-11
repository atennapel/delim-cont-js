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
      result = f();
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
    return this.bind(c.reset(() => this.ret(f())), this.ret);
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

const c = new Thermo();
const test = 1 + c.reset(() => 2 * c.shift(k => k(10)));
console.log(test);

const n = new Represent(x => [x], arrBind);
const test2 = n.reify(() => n.reflect([1, 2, 3]) * n.reflect([4, 5, 6]));
console.log(test2);
