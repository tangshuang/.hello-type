import Type from './type.js'
import { isFunction, isInstanceOf, isNumber, isString, isBoolean, inObject, isNumeric, isNull, isUndefined } from './utils.js'
import { xError, TxpeError } from './error.js'

export class Rule {
  /**
   *
   * @param {*} name
   * @param {*} validate should must return an error or null
   * @param {*} override
   */
  constructor(name, validate, override) {
    if (isFunction(name)) {
      override = validate
      validate = name
      name = null
    }

    this.validate = validate
    this.override = override
    this.name = name
  }
  toString() {
    return this.name
  }
}

export default Rule


// create a simple rule
export function makeRule(name, determine, message = 'shouldmatch') {
  if (isFunction(name)) {
    message = determine
    determine = name
    name = null
  }

  return new Rule(name, function(value) {
    const msg = isFunction(message) ? message(value) : message
    if ((isFunction(determine) && !determine.call(this, value)) || (isBoolean(determine) && !determine)) {
      return new TxpeError(msg, { value, rule: this, level: 'rule' })
    }
  })
}

// create a rule generator (a function) which return a rule
// fn should must return a rule
function makeRuleGenerator(name, fn) {
  return function(...args) {
    let rule = fn(...args)
    rule.arguments = args
    rule.name = name
    return rule
  }
}

export const Null = makeRule('Null', isNull)
export const Undefined = makeRule('Undefined', isUndefined)
export const Any = makeRule('Any', true)
export const Numeric = makeRule('Numeric', isNumeric)
export const Int = makeRule('Int', value => isNumber(value) && parseInt(value) === value)
export const Float = makeRule('Float', value => isNumber(value) && float % 1 !== 0)

/**
 * asynchronous rule
 * @param {Function} fn which can be an async function and should return a rule
 */
export const asynchronous = makeRuleGenerator('asynchronous', function(fn) {
  const rule = new Rule(function(value) {
    if (this.__await__) {
      let rule = this.__await__
      if (isInstanceOf(rule, Rule)) {
        let error = rule.validate(value)
        return xError(error, { value, rule, level: 'rule' })
      }
      else if (isInstanceOf(rule, Type)) {
        let error = rule.catch(value)
        return xError(error, { value, rule, level: 'rule' })
      }
      else {
        let type = new Type(rule)
        let error = type.catch(value)
        return xError(error, { value, rule, level: 'rule' })
      }
    }
    return true
  })
  rule.__async__ = Promise.resolve().then(() => fn()).then((type) => {
    rule.__await__ = type
    return type
  })
  return rule
})

/**
 * Verify a rule by using custom error message
 * @param {Rule|Type|Function} rule
 * @param {String|Function} message
 */
export const validate = makeRuleGenerator('validate', function(rule, message) {
  if (isFunction(rule)) {
    return makeRule(rule, message)
  }

  if (isInstanceOf(rule, Rule)) {
    return makeRule((value) => rule.validate(value), message)
  }

  if (isInstanceOf(rule, Type)) {
    return makeRule((value) => rule.test(value), message)
  }

  let type = new Type(rule)
  return validate(type, message)
})

/**
 * the passed value should match all passed rules
 * @param {...any} rules
 * @example
 * const SomeType = Dict({
 *   value: shouldmatch(
 *     validate(Number, 'it should be a number'),
 *     validate(value => value === parseInt(value, 10), 'it should be an int number')
 *   )
 * })
 */
export const shouldmatch = makeRuleGenerator('shouldmatch', function(...rules) {
  return new Rule(function(value) {
    const validate = (value, rule) => {
      if (isInstanceOf(rule, Rule)) {
        let error = rule.validate(value)
        return xError(error, { value, rule: this, level: 'rule' })
      }

      if (isInstanceOf(rule, Type)) {
        let error = rule.catch(value)
        return xError(error, { value, rule: this, level: 'rule' })
      }

      let type = new Type(rule)
      return validate(value, type)
    }
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let error = validate(value, rule)
      if (error) {
        return error
      }
    }
  })
})

/**
 * the passed value should not match rules
 * @param {...any} rules
 */
export const shouldnotmatch = makeRuleGenerator('shouldnotmatch', function(...rules) {
  return new Rule(function(value) {
    const validate = (value, rule) => {
      if (isInstanceOf(rule, Rule)) {
        let error = rule.validate(value)
        if (!error) {
          return new TxpeError('shouldnotmatch', { value, rule: this, level: 'rule' })
        }
      }

      if (isInstanceOf(rule, Type)) {
        let error = rule.catch(value)
        if (!error) {
          return new TxpeError('shouldnotmatch', { value, rule: this, level: 'rule' })
        }
      }

      let type = new Type(rule)
      return validate(value, type)
    }
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let error = validate(value, rule)
      if (error) {
        return error
      }
    }
  })
})

/**
 * If the value exists, use rule to validate.
 * If not exists, ignore this rule.
 * @param {*} rule
 */
export const ifexist = makeRuleGenerator('ifexist', function(rule) {
  let isReady = false
  let isExist = false
  let data = []

  const prepare = function(error, prop, target) {
    isReady = true
    if (inObject(prop, target)) {
      isExist = true
    }
    data = [prop, target]
  }

  if (isInstanceOf(rule, Rule)) {
    return new Rule(function(value) {
      if (!isReady) {
        return new TxpeError('ifexist not ready', { value, rule: this })
      }
      if (!isExist) {
        return null
      }

      let error = rule.validate(value)

      // use rule to override property when not match
      // override value and check again
      // so that you can use `ifexist(ifnotmatch(String, ''))`
      if (error && isFunction(rule.override)) {
        let [prop, target] = data
        rule.override(error, prop, target)
        value = target[prop]
        error = rule.validate(value)
      }

      return xError(error, { value, rule: this, level: 'rule' })
    }, prepare)
  }

  if (isInstanceOf(rule, Type)) {
    return new Rule(function(value) {
      if (!isReady) {
        return new TxpeError('ifexist not ready.', { value, rule: this })
      }
      if (!isExist) {
        return null
      }

      let error = rule.catch(value)
      return xError(error, { value, rule: this, level: 'rule' })
    }, prepare)
  }

  let type = new Type(rule)
  return ifexist(type)
})

/**
 * If the value not match rule, use defaultValue as value.
 * Notice, this will modify original data, which may cause error, so be careful.
 * @param {*} rule
 * @param {function} callback a function to return new value with origin old value
 */
export const ifnotmatch = makeRuleGenerator('ifnotmatch', function(rule, callback) {
  if (isInstanceOf(rule, Rule)) {
    return new Rule(function(value) {
      let error = rule.validate(value)
      return xError(error, { value, rule: this, level: 'rule' })
    }, function(error, prop, target) {
      if (error) {
        target[prop] = isFunction(callback) ? callback(target[prop]) : callback
      }
    })
  }

  if (isInstanceOf(rule, Type)) {
    return new Rule(function(value) {
      let error = rule.catch(value)
      return xError(error, { value, rule: this, level: 'rule' })
    }, function(error, prop, target) {
      if (error) {
        target[prop] = isFunction(callback) ? callback(target[prop]) : callback
      }
    })
  }

  let type = new Type(rule)
  return ifnotmatch(type, callback)
})

/**
 * determine which rule to use.
 * @param {function} factory a function to receive parent node of current prop, and return a rule
 * @example
 * const SomeType = Dict({
 *   name: String,
 *   isMale: Boolean,
 *   // data type check based on person.isMale
 *   touch: determine(function(value, key, person) {
 *     if (person.isMale) {
 *       return String
 *     }
 *     else {
 *       return Null
 *     }
 *   }),
 * })
 */
export const determine = makeRuleGenerator('determine', function(determine) {
  let isReady = false
  let rule

  return new Rule(function(value) {
    if (!isReady) {
      return new TxpeError('determine not ready.', { value, rule: this })
    }

    if (isInstanceOf(rule, Rule)) {
      let error = rule.validate(value)

      // use rule to override property when not match
      // override value and check again
      // so that you can use `determine((value, key, data) => {
      //   if (data.isMale) return ifnotmatch(String, '')
      //   else return null
      // })`
      if (error && isFunction(rule.override)) {
        let [prop, target] = data
        rule.override(error, prop, target)
        value = target[prop]
        error = rule.validate(value)
      }

      return xError(error, { value, rule: this, level: 'rule' })
    }

    if (isInstanceOf(rule, Type)) {
      let error = rule.catch(value)
      return xError(error, { value, rule: this, level: 'rule' })
    }

    let type = new Type(rule)
    let error = type.catch(value)
    return xError(error, { value, rule: this, level: 'rule' })
  }, function(error, prop, target) {
    rule = determine(target[prop], prop, target)
    isReady = true
  })
})

/**
 * Advance version of ifexist, determine whether a prop can not exist with a determine function,
 * if the prop is existing, use the passed type to check.
 * @param {function} determine the function to return true or false,
 * if true, it means the prop should must exists and will use the second parameter to check data type,
 * if false, it means the prop can not exist
 * @param {*} rule when the determine function return true, use this to check data type
 * @example
 * const SomeType = Dict({
 *   name: String,
 *   isMale: Boolean,
 *   // data type check based on person.isMale, if person.isMale is true, touch should be String, or touch can not exist
 *   touch: shouldexist((value, key, person) => person.isMale, String),
 * })
 */
export const shouldexist = makeRuleGenerator('shouldexist', function(determine, rule) {
  let isReady = false
  let shouldExist = true
  let isExist = false

  return new Rule(function(value) {
    if (!isReady) {
      return new TxpeError('shouldexist not ready.', { value, rule: this })
    }

    // can not exists and it not exists, do nothing
    if (!shouldExist && !isExist) {
      return null
    }

    if (isInstanceOf(rule, Rule)) {
      let error = rule.validate(value)

      // use rule to override property when not match
      // override value and check again
      // so that you can use `shouldexist(() => true, ifnotmatch(String, ''))`
      if (error && isFunction(rule.override)) {
        let [prop, target] = data
        rule.override(error, prop, target)
        value = target[prop]
        error = rule.validate(value)
      }

      return xError(error, { value, rule: this, level: 'rule' })
    }

    if (isInstanceOf(rule, Type)) {
      let error = rule.catch(value)
      return xError(error, { value, rule: this, level: 'rule' })
    }

    let type = new Type(rule)
    let error = type.catch(value)
    return xError(error, { value, rule: this, level: 'rule' })
  }, function(error, prop, target) {
    shouldExist = determine(target[prop], prop, target)
    isReady = true
    isExist = inObject(prop, target)
  })
})

/**
 * Advance version of ifexist, determine whether a prop can not exist with a determine function,
 * if the prop is existing, use the passed type to check.
 * @param {function} determine the function to return true or false,
 * if true, it means the prop should must exists and will use the second parameter to check data type,
 * if false, it means the prop can not exist
 * @param {*} rule when the determine function return true, use this to check data type
 * @example
 * const SomeType = Dict({
  *   name: String,
  *   isMale: Boolean,
  *   // data type check based on person.isMale, if person.isMale is true, touch should be String, or touch can not exist
  *   touch: shouldnotexist((value, key, person) => person.isMale, String),
  * })
  */
 export const shouldnotexist = makeRuleGenerator('shouldnotexist', function(determine, rule) {
   let isReady = false
   let shouldNotExist = false
   let isExist = false
   let data = []

   return new Rule(function(value) {
     if (!isReady) {
       return new TxpeError('shouldnotexist not ready.', { value, rule: this })
     }

     // can not exists and it not exists, do nothing
     if (shouldNotExist && !isExist) {
       return null
     }

     const [key] = data
     return new TxpeError('overflow', { value, rule: this, level: 'rule', key })
   }, function(error, prop, target) {
    shouldNotExist = determine(target[prop], prop, target)
    isReady = true
    isExist = inObject(prop, target)
    data = [prop, target]
   })
 })

/**
 * Whether the value is an instance of given class
 * @param {*} rule should be a class constructor
 */
export const implement = makeRuleGenerator('implement', function(rule) {
  return makeRule((value) => isInstanceOf(value, rule, true))
})

/**
 * Whether the value is eqaul to the given value
 * @param {*} rule
 */
export const equal = makeRuleGenerator('equal', function(rule) {
  return makeRule((value) => value === rule)
})

/**
 * Wether the value is a function
 * @param {Tuple} InputType
 * @param {Any} OutputType
 */
export const lambda = makeRuleGenerator('lambda', function(InputType, OutputType) {
  if (!isInstanceOf(InputType, Type)) {
    InputType = new Type(InputType)
  }
  if (!isInstanceOf(OutputType, Type)) {
    OutputType = new Type(OutputType)
  }

  return new Rule(function(value) {
    if (!isFunction(value)) {
      return new TxpeError('shouldmatch', { value, rule: this, level: 'rule' })
    }
  }, function(error, prop, target) {
    if (!error) {
      let fn = target[prop].bind(target)
      let lambda = function(...args) {
        InputType.assert(...args)
        let result = fn(...args)
        OutputType.assert(result)
        return result
      }
      target[prop] = lambda
    }
  })
})
