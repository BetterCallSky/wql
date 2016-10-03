import _ from 'lodash';

const _operators = ['$in', '$like', '$ne', '$eq', '$gte', '$lte', '$gt', '$lt'];
const _simpleOperators = {
  $ne: '!=',
  $eq: '=',
  $lte: '<=',
  $lt: '<',
  $gt: '>',
  $gte: '>=',
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
  if (_.isString(value)) {
    return `"${value}"`;
  }
  if (_.isNumber(value) || _.isBoolean(value)) {
    return String(value);
  }
  if (_.isDate(value)) {
    return value.toISOString();
  }
  throw new Error(`Cannot serialize ${value}. Only strings, numbers, booleans and dates are allowed.`);
}

/**
 * Join conditions by AND/OR
 * @param {Array} conditions
 * @param {String} op
 * @returns {String}
 * @private
 */
function _joinConditions(conditions, op) {
  const joined = conditions.join(` ${op} `);
  if (conditions.length > 1) {
    return `(${joined})`;
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
  const keys = _.keys(obj);
  if (!keys.length) {
    throw new Error('Must define an operator: ', _operators.join(', '));
  }

  _.forEach(keys, (key) => {
    if (!_.includes(_operators, key)) {
      throw new Error(`Operator not supported: ${key}`);
    }
  });

  if (keys.length > 1 && (_.has(obj, '$ne') || _.has(obj, '$eq') || _.has(obj, '$like') || _.has(obj, '$in'))) {
    throw new Error('$in, $ne, $eq, $like must be the only statement');
  }
  if (_.has(obj, '$in')) {
    const values = obj.$in;
    if (!_.isArray(values)) {
      throw new Error('Values for $in must be an array');
    }
    if (!values.length) {
      throw new Error('Values for $in must contain at least 1 element');
    }
    const conditions = _.map(values, (value) => `${name} = ${_serializeValue(value)}`);
    return _joinConditions(conditions, 'OR');
  }
  if (_.has(obj, '$like')) {
    const like = obj.$like;
    if (!_.isString(like)) {
      throw new Error('Value for $like must be a string');
    }
    if (!like) {
      throw new Error('value for $like cannot be null or empty');
    }
    return `${name} like "%${like}%"`;
  }
  if (_.has(obj, '$ne')) {
    return `${name} != ${_serializeValue(obj.$ne)}`;
  }
  if (_.has(obj, '$eq')) {
    return `${name} = ${_serializeValue(obj.$eq)}`;
  }
  const conditions = [];
  const ops = ['$lte', '$lt', '$gte', '$gt'];
  _.forEach(ops, (op) => {
    if (_.has(obj, op)) {
      conditions.push(`${name} ${_simpleOperators[op]} ${_serializeValue(obj[op])}`);
    }
  });
  return _joinConditions(conditions, 'AND');
}

/**
 * Build Open Access filter using syntax from MongoDB
 * @param {Object} query
 * @returns {String} the serialized query
 */
export default function buildFilter(query) {
  if (!_.isObject(query)) {
    throw new Error(`query must be an object, got: ${query}`);
  }
  const keys = _.keys(query);

  if (query.$and || query.$or) {
    if (keys.length > 1) {
      throw new Error('$or/$and must be used without any properties');
    }
    const conditions = query.$and || query.$or;
    if (!_.isArray(conditions)) {
      throw new Error('Must pass an array for $or/$and');
    }
    let mapped = _.map(conditions, buildFilter);
    if (mapped.length > 1) {
      mapped = _.map(mapped, (part) => `(${part})`);
    }
    return mapped.join(query.$and ? ' AND ' : ' OR ');
  }

  const conditions = [];

  _.forEach(query, (value, prop) => {
    if (prop[0] === '$') {
      throw new Error(`Invalid query. ${prop} is not allowed.`);
    }
    if (_.isPlainObject(value)) {
      conditions.push(_convertToString(prop, value));
    } else {
      conditions.push(`${prop} = ${_serializeValue(value)}`);
    }
  });
  return conditions.join(' AND ');
}
