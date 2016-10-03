'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = buildFilter;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _operators = ['$in', '$like', '$ne', '$eq', '$gte', '$lte', '$gt', '$lt'];
var _simpleOperators = {
  $ne: '!=',
  $eq: '=',
  $lte: '<=',
  $lt: '<',
  $gt: '>',
  $gte: '>='
};

/**
 * Serialize value
 * @param {*} value
 * @returns {String}
 * @private
 */
function _serializeValue(value) {
  if (value === null) {
    return 'null';
  }
  if (_lodash2.default.isString(value)) {
    return '"' + value + '"';
  }
  if (_lodash2.default.isNumber(value) || _lodash2.default.isBoolean(value)) {
    return String(value);
  }
  if (_lodash2.default.isDate(value)) {
    return value.toISOString();
  }
  throw new Error('Cannot serialize ' + value + '. Only strings, numbers, booleans and dates are allowed.');
}

/**
 * Join conditions by AND/OR
 * @param {Array} conditions
 * @param {String} op
 * @returns {String}
 * @private
 */
function _joinConditions(conditions, op) {
  var joined = conditions.join(' ' + op + ' ');
  if (conditions.length > 1) {
    return '(' + joined + ')';
  }
  return joined;
}

/**
 * Parse condition to string
 * @param {String} name
 * @param {Object} obj
 * @returns {String}
 * @private
 */
function _convertToString(name, obj) {
  var keys = _lodash2.default.keys(obj);
  if (!keys.length) {
    throw new Error('Must define an operator: ', _operators.join(', '));
  }

  _lodash2.default.forEach(keys, function (key) {
    if (!_lodash2.default.includes(_operators, key)) {
      throw new Error('Operator not supported: ' + key);
    }
  });

  if (keys.length > 1 && (_lodash2.default.has(obj, '$ne') || _lodash2.default.has(obj, '$eq') || _lodash2.default.has(obj, '$like') || _lodash2.default.has(obj, '$in'))) {
    throw new Error('$in, $ne, $eq, $like must be the only statement');
  }
  if (_lodash2.default.has(obj, '$in')) {
    var values = obj.$in;
    if (!_lodash2.default.isArray(values)) {
      throw new Error('Values for $in must be an array');
    }
    if (!values.length) {
      throw new Error('Values for $in must contain at least 1 element');
    }
    var _conditions = _lodash2.default.map(values, function (value) {
      return name + ' = ' + _serializeValue(value);
    });
    return _joinConditions(_conditions, 'OR');
  }
  if (_lodash2.default.has(obj, '$like')) {
    var like = obj.$like;
    if (!_lodash2.default.isString(like)) {
      throw new Error('Value for $like must be a string');
    }
    if (!like) {
      throw new Error('value for $like cannot be null or empty');
    }
    return name + ' like "%' + like + '%"';
  }
  if (_lodash2.default.has(obj, '$ne')) {
    return name + ' != ' + _serializeValue(obj.$ne);
  }
  if (_lodash2.default.has(obj, '$eq')) {
    return name + ' = ' + _serializeValue(obj.$eq);
  }
  var conditions = [];
  var ops = ['$lte', '$lt', '$gte', '$gt'];
  _lodash2.default.forEach(ops, function (op) {
    if (_lodash2.default.has(obj, op)) {
      conditions.push(name + ' ' + _simpleOperators[op] + ' ' + _serializeValue(obj[op]));
    }
  });
  return _joinConditions(conditions, 'AND');
}

/**
 * Build Open Access filter using syntax from MongoDB
 * @param {Object} query
 * @returns {String} the serialized query
 */
function buildFilter(query) {
  if (!_lodash2.default.isObject(query)) {
    throw new Error('query must be an object, got: ' + query);
  }
  var keys = _lodash2.default.keys(query);

  if (query.$and || query.$or) {
    if (keys.length > 1) {
      throw new Error('$or/$and must be used without any properties');
    }
    var _conditions2 = query.$and || query.$or;
    if (!_lodash2.default.isArray(_conditions2)) {
      throw new Error('Must pass an array for $or/$and');
    }
    var mapped = _lodash2.default.map(_conditions2, buildFilter);
    if (mapped.length > 1) {
      mapped = _lodash2.default.map(mapped, function (part) {
        return '(' + part + ')';
      });
    }
    return mapped.join(query.$and ? ' AND ' : ' OR ');
  }

  var conditions = [];

  _lodash2.default.forEach(query, function (value, prop) {
    if (prop[0] === '$') {
      throw new Error('Invalid query. ' + prop + ' is not allowed.');
    }
    if (_lodash2.default.isPlainObject(value)) {
      conditions.push(_convertToString(prop, value));
    } else {
      conditions.push(prop + ' = ' + _serializeValue(value));
    }
  });
  return conditions.join(' AND ');
}