import buildFilter from '../src/buildFilter';

describe('common/build-filter', () => {
  describe('errors', () => {
    it('should throw if filter is not an object', () => {
      const err = 'query must be an object';
      expect(() => buildFilter()).to.throw(err);
      expect(() => buildFilter('foo')).to.throw(err);
      expect(() => buildFilter(null)).to.throw(err);
    });

    it('should throw if value cannot be serialized', () => {
      expect(() => buildFilter({ foo: [{}] })).to.throw('Cannot serialize');
    });

    it('should throw if $like is not a string', () => {
      expect(() => buildFilter({ foo: { $like: 1 } })).to.throw('Value for $like must be a string');
    });

    it('should throw if $like is empty', () => {
      expect(() => buildFilter({ foo: { $like: '' } })).to.throw('value for $like cannot be null or empty');
    });

    it('should throw if $startsWith is not a string', () => {
      expect(() => buildFilter({ foo: { $startsWith: 1 } })).to.throw('Value for $startsWith must be a string');
    });

    it('should throw if $startsWith is empty', () => {
      expect(() => buildFilter({ foo: { $startsWith: '' } })).to.throw('value for $startsWith cannot be null or empty');
    });

    it('should throw if empty operator', () => {
      expect(() => buildFilter({ foo: { } })).to.throw('Must define an operator');
    });

    it('should throw if invalid operator (left side)', () => {
      expect(() => buildFilter({ $foo: 'bar' })).to.throw('Invalid query. $foo is not allowed.');
    });

    it('should throw if invalid operator (right side)', () => {
      expect(() => buildFilter({ bar: { $foo: 1 } })).to.throw('Operator not supported: $foo');
    });

    it('should throw if $or/$and is not an array', () => {
      const err = 'Must pass an array for $or/$and';
      expect(() => buildFilter({ $and: 'foo' })).to.throw(err);
      expect(() => buildFilter({ $or: 'foo' })).to.throw(err);
    });

    it('should throw if $or/$and has multiple keys', () => {
      const err = '$or/$and must be used without any properties';
      const conditions = [{ a: 1 }, { b: 1 }];
      expect(() => buildFilter({ $and: conditions, foo: 1 })).to.throw(err);
      expect(() => buildFilter({ $or: conditions, foo: 2 })).to.throw(err);
    });

    it('should throw if values in $in are not an array', () => {
      const err = 'Values for $in must be an array';
      expect(() => buildFilter({ foo: { $in: 'foo' } })).to.throw(err);
    });

    it('should throw if values in $in are empty', () => {
      const err = 'Values for $in must contain at least 1 element';
      expect(() => buildFilter({ foo: { $in: [] } })).to.throw(err);
    });

    it('should throw if values in $nin are not an array', () => {
      const err = 'Values for $nin must be an array';
      expect(() => buildFilter({ foo: { $nin: 'foo' } })).to.throw(err);
    });

    it('should throw if values in $nin are empty', () => {
      const err = 'Values for $nin must contain at least 1 element';
      expect(() => buildFilter({ foo: { $nin: [] } })).to.throw(err);
    });

    it('should throw if $in, $ne, $eq, $like are not the only statements', () => {
      const err = '$nin, $in, $ne, $eq, $like, $startsWith must be the only statement';
      expect(() => buildFilter({ bar: { $ne: 1, $gt: 2 } })).to.throw(err);
      expect(() => buildFilter({ bar: { $eq: 1, $gt: 2 } })).to.throw(err);
      expect(() => buildFilter({ bar: { $like: '1', $gt: 2 } })).to.throw(err);
      expect(() => buildFilter({ bar: { $like: '1', $startsWith: '2' } })).to.throw(err);
      expect(() => buildFilter({ bar: { $in: '1', $gt: 2 } })).to.throw(err);
      expect(() => buildFilter({ bar: { $in: '1', $nin: 2 } })).to.throw(err);
    });
  });

  describe('accuracy', () => {
    it('should build a null query', () => {
      const filter = buildFilter({ foo: null });
      expect(filter).to.equal('foo = null');
    });

    it('should build a string query', () => {
      const filter = buildFilter({ foo: 'a' });
      expect(filter).to.equal('foo = "a"');
    });

    it('should build a number query', () => {
      const filter = buildFilter({ foo: 1 });
      expect(filter).to.equal('foo = 1');
    });

    it('should build a number query', () => {
      const filter = buildFilter({ foo: true });
      expect(filter).to.equal('foo = true');
    });

    it('should build a date query', () => {
      const date = '2000-01-01T00:00:00.000Z';
      const filter = buildFilter({ foo: new Date(date) });
      expect(filter).to.equal(`foo = ${date}`);
    });

    it('should build a $like query', () => {
      const filter = buildFilter({ foo: { $like: 'bar' } });
      expect(filter).to.equal('foo like "%bar%"');
    });

    it('should build a $startsWith query', () => {
      const filter = buildFilter({ foo: { $startsWith: 'bar' } });
      expect(filter).to.equal('foo like "bar%"');
    });

    it('should build a $ne query', () => {
      const filter = buildFilter({ foo: { $ne: 'bar' } });
      expect(filter).to.equal('foo != "bar"');
    });

    it('should build a $eq query', () => {
      const filter = buildFilter({ foo: { $eq: 'bar' } });
      expect(filter).to.equal('foo = "bar"');
    });

    it('should build a $lt query', () => {
      const filter = buildFilter({ foo: { $lt: 1 } });
      expect(filter).to.equal('foo < 1');
    });

    it('should build a $lte query', () => {
      const filter = buildFilter({ foo: { $lte: 1 } });
      expect(filter).to.equal('foo <= 1');
    });

    it('should build a $gt query', () => {
      const filter = buildFilter({ foo: { $gt: 1 } });
      expect(filter).to.equal('foo > 1');
    });

    it('should build a $gte query', () => {
      const filter = buildFilter({ foo: { $gte: 1 } });
      expect(filter).to.equal('foo >= 1');
    });

    it('should build a $gt with $lte query', () => {
      const filter = buildFilter({ foo: { $lt: 5, $gt: 1 } });
      expect(filter).to.equal('(foo < 5 AND foo > 1)');
    });

    it('should build a $in query', () => {
      const filter = buildFilter({ foo: { $in: [1, 2, 3] } });
      expect(filter).to.equal('(foo = 1 OR foo = 2 OR foo = 3)');
    });

    it('should build a $nin query', () => {
      const filter = buildFilter({ foo: { $nin: [1, 2, 3] } });
      expect(filter).to.equal('(foo != 1 AND foo != 2 AND foo != 3)');
    });

    it('should build a complex query', () => {
      const filter = buildFilter({ foo: 1, bar: 'a' });
      expect(filter).to.equal('foo = 1 AND bar = "a"');
    });

    it('should build a complex query with $and', () => {
      const filter = buildFilter({
        $and: [
          { foo1: 1, bar1: 'a' },
          { foo2: 2, bar2: 'b' },
        ],
      });
      expect(filter).to.equal('(foo1 = 1 AND bar1 = "a") AND (foo2 = 2 AND bar2 = "b")');
    });

    it('should build a complex query with $or', () => {
      const filter = buildFilter({
        $or: [
          { foo1: 1, bar1: 'a' },
          { foo2: 2, bar2: 'b' },
        ],
      });
      expect(filter).to.equal('(foo1 = 1 AND bar1 = "a") OR (foo2 = 2 AND bar2 = "b")');
    });


    it('should build a complex query with $and (single item)', () => {
      const filter = buildFilter({
        $or: [
          { foo1: 1, bar1: 'a' },
        ],
      });
      expect(filter).to.equal('foo1 = 1 AND bar1 = "a"');
    });

    it('should build a complex nested query', () => {
      const filter = buildFilter({
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
      expect(filter).to.equal('(foo1 = 1 AND bar1 = "a") AND ((a = 1 AND c = 1) OR (b = 2 AND c = 1))');
    });
  });
});

