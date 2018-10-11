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
      result = f(x => this.shift(x), x => this.shift(k => k(x)));
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

const Monad = (ret, bind) => ({ ret, bind });

class Represent {
  constructor(m) {
    this.c = new Thermo();
    this.m = m;
  }

  reflect(x) {
    return this.c.shift(k => this.m.bind(x, k));
  }
  reify(f) {
    return this.m.bind(this.c.reset(() => this.m.ret(f(x => this.reflect(x)))), this.m.ret);
  }
}

const delim = f => {
  const d = new Thermo();
  return d.reset(f);
}

const reflect = (monad, fn) => {
  const r = new Represent(monad);
  return r.reify(fn);
};

module.exports = {
  Thermo,
  Represent,
  delim,
  Monad,
  reflect,
};
