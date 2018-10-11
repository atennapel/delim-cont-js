# delim-cont-js
Implementation of the delimited continuations (called "Thermometer Continuations") from the paper "Capturing the Future by Replaying the Past" in Javascript. <br/>

Translated from: https://github.com/jkoppel/thermometer-continuations <br/>
The paper: https://arxiv.org/abs/1710.10385

Todo:
* Cleaner implementation
* Typescript implementation
* More examples
* Implementation of algebraic effects and handlers

## examples
```javascript
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
```
