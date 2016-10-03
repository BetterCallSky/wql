/* eslint-disable no-console, no-magic-numbers */
import wql from '../src/buildFilter';

let output;

output = wql({
  propString: 'str',
  propLike: { $like: 'foo' },
  propNumber: { $gt: 1 },
  propBool: true,
});

console.log(output);

output = wql({
  foo: { $in: [1, 2, 5, 10] },
});
console.log(output);

output = wql({
  $and: [
    { foo1: 1, bar1: 'a' },
    { foo2: 2, bar2: 'b' },
  ],
});

console.log(output);

output = wql({
  $or: [
    { foo1: 1, bar1: 'a' },
    { foo2: 2, bar2: 'b' },
  ],
});

console.log(output);

output = wql({
  $and: [
    { foo1: 1, bar1: 'a' },
    {
      $or: [
        { a: 1, c: 1 },
        { b: 2, c: 1 },
      ],
    },
  ],
});

console.log(output);
