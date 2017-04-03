# wql
[![Build Status](https://travis-ci.org/lsentkiewicz/wql.svg?branch=master)](https://travis-ci.org/lsentkiewicz/wql)
[![codecov](https://codecov.io/gh/lsentkiewicz/wql/branch/master/graph/badge.svg)](https://codecov.io/gh/lsentkiewicz/wql)

wql is a WHERE clause generator for [WQL](https://msdn.microsoft.com/en-us/library/aa394606(v=vs.85).aspx) queries using MongoDB syntax.  

## Installation

```
npm i --save wql
```


## Examples

```js
import wql from 'wql';
```

#### Simple matching

```js
wql({
  propString: 'str',
  propLike: { $like: 'foo' },
  propNumber: { $gt: 1 },
  propBool: true,
});
```
output
```
propString = "str" AND propLike like "%foo%" AND propNumber > 1 AND propBool = true
```


#### Arrays (in)
```js
wql({
  foo: { $in: [1, 2, 5, 10] },
});
```
output
```
(foo = 1 OR foo = 2 OR foo = 5 OR foo = 10)
```

#### Arrays (not in)
```js
wql({
  foo: { $nin: [1, 2, 5, 10] },
});
```
output
```
(foo != 1 AND foo != 2 AND foo != 5 AND foo != 10)
```

#### AND
```js
wql({
  $and: [
    { foo1: 1, bar1: 'a' },
    { foo2: 2, bar2: 'b' },
  ],
});
```
output
```
(foo1 = 1 AND bar1 = "a") AND (foo2 = 2 AND bar2 = "b")
```

#### OR
```js
wql({
  $or: [
    { foo1: 1, bar1: 'a' },
    { foo2: 2, bar2: 'b' },
  ],
});
```
output
```
(foo1 = 1 AND bar1 = "a") OR (foo2 = 2 AND bar2 = "b")
```


#### Nested queries
```js
wql({
  $and: [
    { foo1: 1, bar1: 'a' },
    {
      $or: [
        { a: 1, c: 1 },
        { b: 2, c: 1 },
      ],
    },
  ],
};
```
output
```
(foo1 = 1 AND bar1 = "a") AND ((a = 1 AND c = 1) OR (b = 2 AND c = 1))
```


## Supported operators
- `$ne`
- `$eq`
- `$gte`
- `$lte`
- `$gt`
- `$lt`
- `$in`
- `$nin`
- `$like`
- `$startsWith`

MIT License

Copyright (c) 2016 Łukasz Sentkiewicz