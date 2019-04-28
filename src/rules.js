import Type from './type.js'
import { isFunction, isInstanceOf, isNumber, isBoolean, inObject, isNumeric, isNull, isUndefined, isArray, isObject } from './utils.js'
import TsError, { makeError } from './error.js'
import Rule from './rule.js'
import Tuple from './tuple.js'

// create a simple rule
export function makeRule(name, determine, message = 'mistaken') {
  if (isFunction(name)) {
    message = determine
    determine = name
    name = null
  }

  const options = {
    name,
    validate: function(value) {
      const msg = isFunction(message) ? message(value) : message
      const info = { value, rule: this, level: 'rule', action: 'validate' }
      if (isFunction(determine) && !determine.call(this, value)) {
        return new TsError(msg, info)
      }
      else if (isBoolean(determine) && !determine) {
        return new TsError(msg, info)
      }
      else {
        return null
      }
    },
  }

  return new Rule(options)
}

// create some basic rules
export const Null = makeRule('Null', isNull)
export const Undefined = makeRule('Undefined', isUndefined)
export const Any = makeRule('Any', true)
export const Numeric = makeRule('Numeric', isNumeric)
export const Int = makeRule('Int', value => isNumber(value) && Number.isInteger(value))
export const Float = makeRule('Float', value => isNumber(value) && !Number.isInteger(value))


// create a rule generator (a function) which return a rule
// fn should must return a rule
function makeRuleGenerator(name, make) {
  return function(...factors) {
    const rule = make(...factors)
    rule.factors = factors
    rule.name = name
    return rule
  }
}

/**
 * Verify a rule by using custom error message
 * @param {Rule|Type|Function} pattern
 * @param {String|Function} message
 */
export const validate = makeRuleGenerator('validate', function(pattern, message) {
  if (isFunction(pattern)) {
    return makeRule(pattern, message)
  }

  if (isInstanceOf(pattern, Rule)) {
    return makeRule(value => pattern.validate(value), message)
  }

  if (isInstanceOf(pattern, Type)) {
    return makeRule(value => pattern.test(value), message)
  }

  let type = new Type(pattern)
  return makeRule(value => type.test(value), message)
})

/**
 * asynchronous rule
 * @param {Function} fn which can be an async function and should return a pattern
 */
export const asynchronous = makeRuleGenerator('asynchronous', function(fn) {
  const rule = new Rule(function(value) {
    if (this.__await__) {
      let pattern = this.__await__
      let info = { value, pattern, rule: this, level: 'rule', action: 'validate' }

      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate(value)
        return makeError(error, info)
      }

      if (isInstanceOf(pattern, Type)) {
        let error = pattern.catch(value)
        return makeError(error, info)
      }

      let type = new Type(rule)
      let error = type.catch(value)
      return makeError(error, info)
    }

    return true
  })
  Promise.resolve().then(() => fn()).then((pattern) => {
    rule.__await__ = pattern
  })
  return rule
})

/**
 * the passed value should match all passed patterns
 * @param {...Pattern} patterns
 */
export const shouldmatch = makeRuleGenerator('shouldmatch', function(...patterns) {
  return new Rule(function(value) {
    const validate = (value, pattern) => {
      let info = { value, pattern, rule: this, level: 'rule', action: 'validate' }
      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate(value)
        return makeError(error, info)
      }

      if (isInstanceOf(pattern, Type)) {
        let error = pattern.catch(value)
        return makeError(error, info)
      }

      let type = new Type(pattern)
      let error = type.catch(value)
      return makeError(error, info)
    }
    for (let i = 0, len = patterns.length; i < len; i ++) {
      let pattern = patterns[i]
      let error = validate(value, pattern)
      if (error) {
        return error
      }
    }
  })
})

/**
 * the passed value should not match patterns
 * @param {...Pattern} patterns
 */
export const shouldnotmatch = makeRuleGenerator('shouldnotmatch', function(...patterns) {
  return new Rule(function(value) {
    const validate = (value, pattern) => {
      let info = { value, pattern, rule: this, level: 'rule', action: 'validate' }
      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate(value)
        if (!error) {
          return new TsError('unexcepted', info)
        }
      }

      if (isInstanceOf(pattern, Type)) {
        let error = pattern.catch(value)
        if (!error) {
          return new TsError('unexcepted', info)
        }
      }

      let type = new Type(pattern)
      let error = type.catch(value)
      if (!error) {
        return new TsError('unexcepted', info)
      }
    }
    for (let i = 0, len = patterns.length; i < len; i ++) {
      let pattern = patterns[i]
      let error = validate(value, pattern)
      if (error) {
        return error
      }
    }
  })
})

/**
 * If the value exists, use rule to validate.
 * If not exists, ignore this rule.
 * @param {Pattern} pattern
 */
export const ifexist = makeRuleGenerator('ifexist', function(pattern) {
  let isReady = false
  let isExist = false
  let data = []

  const prepare = (value, key, target) => {
    isReady = true
    if (inObject(key, target)) {
      isExist = true
    }
    data = [key, target]
  }

  const make = (callback) => function(value) {
    if (!isReady) {
      return new TsError('ifexist not ready')
    }
    if (!isExist) {
      return null
    }

    const [key, target] = data
    const info = { value, pattern, rule: this, level: 'rule', action: 'validate' }

    if (target && isArray(target)) {
      info.index = key
    }
    else if (target && isObject(target)) {
      info.key = key
    }

    let error = callback.call(this, value)
    return makeError(error, info)
  }

  if (isInstanceOf(pattern, Rule)) {
    return new Rule({
      validate: make(function(value) {
        let [key, target] = data
        let error = pattern.validate2(value, key, target)
        return error
      }),
      override: prepare,
    })
  }

  if (isInstanceOf(pattern, Type)) {
    return new Rule({
      validate: make(function(value) {
        let error = pattern.catch(value)
        return error
      }),
      override: prepare,
    })
  }

  let type = new Type(pattern)
  return new Rule({
    validate: make(function(value) {
      let error = type.catch(value)
      return error
    }),
    override: prepare,
  })
})

/**
 * If the value not match pattern, use defaultValue as value.
 * Notice, this will modify original data, which may cause error, so be careful.
 * @param {Pattern} pattern
 * @param {Function|Any} callback a function to return new value with origin old value
 */
export const ifnotmatch = makeRuleGenerator('ifnotmatch', function(pattern, callback) {
  const override = function(value, prop, target) {
    target[prop] = isFunction(callback) ? callback(value) : callback
  }

  if (isInstanceOf(pattern, Rule)) {
    return new Rule({
      validate: function(value) {
        const info = { value, pattern, rule: this, level: 'rule', action: 'validate' }
        let error = pattern.validate(value)
        return makeError(error, info)
      },
      override,
    })
  }

  if (isInstanceOf(pattern, Type)) {
    return new Rule({
      validate: function(value) {
        const info = { value, pattern, rule: this, level: 'rule', action: 'validate' }
        let error = pattern.catch(value)
        return makeError(error, info)
      },
      override,
    })
  }

  let type = new Type(pattern)
  return new Rule({
    validate: function(value) {
      const info = { value, pattern, rule: this, level: 'rule', action: 'validate' }
      let error = type.catch(value)
      return makeError(error, info)
    },
    override,
  })
})

/**
 * determine which pattern to use.
 * @param {Function} determine a function to receive parent node of current prop, and return a pattern
 */
export const determine = makeRuleGenerator('determine', function(determine) {
  let isReady = false
  let pattern
  let data = []

  return new Rule({
    validate: function(value) {
      if (!isReady) {
        return new TsError('determine not ready.')
      }

      const [key, target] = data
      const info = { value, pattern, rule: this, level: 'rule', action: 'validate' }

      if (target && isArray(target)) {
        info.index = key
      }
      else if (target && isObject(target)) {
        info.key = key
      }

      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate2(value, key, target)
        return makeError(error, info)
      }

      if (isInstanceOf(pattern, Type)) {
        let error = pattern.catch(value)
        return makeError(error, info)
      }

      let type = new Type(pattern)
      let error = type.catch(value)
      return makeError(error, info)
    },
    override: function(value, key, target) {
      pattern = determine(value, key, target)
      isReady = true
      data = [key, target]
    },
  })
})

/**
 * Advance version of ifexist, determine whether a prop can not exist with a determine function,
 * if the prop is existing, use the passed type to check.
 * @param {Function} determine the function to return true or false,
 * if true, it means the prop should must exists and will use the second parameter to check data type,
 * if false, it means the prop can not exist
 * @param {Pattern} pattern when the determine function return true, use this to check data type
 */
export const shouldexist = makeRuleGenerator('shouldexist', function(determine, pattern) {
  let isReady = false
  let shouldExist = true
  let isExist = false
  let data = []

  return new Rule({
    validate: function(value) {
      if (!isReady) {
        return new TsError('shouldexist not ready.')
      }

      const [key, target] = data
      const info = { value, pattern, rule: this, level: 'rule', action: 'validate' }

      if (target && isArray(target)) {
        info.index = key
      }
      else if (target && isObject(target)) {
        info.key = key
      }

      // can not exist and it does not exist, do nothing
      if (!shouldExist && !isExist) {
        return null
      }

      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate2(value, key, target)
        return makeError(error, info)
      }

      if (isInstanceOf(pattern, Type)) {
        let error = pattern.catch(value)
        return makeError(error, info)
      }

      let type = new Type(pattern)
      let error = type.catch(value)
      return makeError(error, info)
    },
    override: function(value, key, target) {
      shouldExist = determine(value, key, target)
      isReady = true
      isExist = inObject(key, target)
      data = [key, target]
    },
  })
})

/**
 * Advance version of ifexist, determine whether a prop can not exist with a determine function,
 * if the prop is existing, use the passed type to check.
 * @param {Function} determine the function to return true or false,
 * if true, it means the prop should must exists and will use the second parameter to check data type,
 * if false, it means the prop can not exist
 * @param {Function} determine when the determine function return true, use this to check data type
  */
export const shouldnotexist = makeRuleGenerator('shouldnotexist', function(determine) {
  let isReady = false
  let shouldNotExist = false
  let isExist = false
  let data = []

  return new Rule({
    validate: function(value) {
      if (!isReady) {
        return new TsError('shouldnotexist not ready.')
      }

      // should not exist and it does not exist, do nothing
      if (shouldNotExist && !isExist) {
        return null
      }

      const [key, target] = data
      const info = { value, rule: this, level: 'rule', action: 'validate' }

      if (target && isArray(target)) {
        info.index = key
      }
      else if (target && isObject(target)) {
        info.key = key
      }

      return new TsError('overflow', info)
    },
    override: function(value, prop, target) {
      shouldNotExist = determine(value, prop, target)
      isReady = true
      isExist = inObject(prop, target)
      data = [prop, target]
    },
  })
})

/**
 * Whether the value is an instance of given class
 * @param {Constructor} Cons should be a class constructor
 */
export const implement = makeRuleGenerator('implement', function(Cons) {
  return makeRule(value => isInstanceOf(value, Cons, true))
})

/**
 * Whether the value is eqaul to the given value
 * @param {Any} value
 */
export const equal = makeRuleGenerator('equal', function(value) {
  return makeRule(v => v === value)
})

/**
 * Wether the value is a function
 * @param {Tuple} InputType
 * @param {Any} OutputType
 */
export const lambda = makeRuleGenerator('lambda', function(InputType, OutputType) {
  if (!isInstanceOf(InputType, Tuple)) {
    throw new TsError('lambda InputType should be a Tuple')
  }
  if (!isInstanceOf(OutputType, Type)) {
    OutputType = new Type(OutputType)
  }

  let isReady = false

  return new Rule({
    validate: function(value) {
      if (!isReady) {
        return new TsError('lambda is not ready.')
      }

      if (!isFunction(value)) {
        const info = { value, pattern: Function, rule: this, level: 'rule', action: 'validate' }
        return new TsError('mistaken', info)
      }
    },
    override: function(value, key, target) {
      const lambda = function(...args) {
        InputType.assert(args)
        let result = value.apply(this, args)
        OutputType.assert(result)
        return result
      }
      target[key] = lambda // Notice, change the original reference
      isReady = true
    },
  })
})
