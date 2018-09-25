import Type from './type'
import { isFunction, isInstanceOf } from './utils'
import { xError, HelloTypeError } from './error'

export default class Rule {
  constructor(...args) {
    if (args.length > 1) {
      this.name = args[0]
      this.vaildate = args[1]
      this.override = args[2]
    }
    else if (args.length > 0) {
      this.vaildate = args[0]
    }
    if (!isFunction(this.vaildate)) {
      this.vaildate = () => null
    }
    if (this.override && !isFunction(this.override)) {
      this.override = () => undefined
    }
  }
  toString() {
    return this.name || 'Rule'
  }
}

export const Null = new Rule('Null', value => value !== null ? new HelloTypeError('rule.null', { target: value, type: this.name }) : null)
export const Undefined = new Rule('Undefined', value => value !== undefined ? new HelloTypeError('rule.undefined', { target: value, type: this.name }): null)
export const Any = new Rule('Any', () => null)

/**
 * Verify a rule by using custom error message
 * @param {Rule|Function} rule 
 * @param {String|Function} message 
 */
export function Validate(rule, message) {
  if (isFunction(rule)) {
    return new Rule('Verify', function(value) {
      if (!rule(value)) {
        let msg = isFunction(message) ? message(value) : message
        return new HelloTypeError(msg, { target: value, rule, type: this.name })
      }
    })
  }
  else {
    let type = new Type(rule)
    return new Rule('Verify', function(value) {
      if (!type.test(value)) {
        let msg = isFunction(message) ? message(value) : message
        return new HelloTypeError(msg, { target: value, rule, type: this.name })
      }
    })
  }
}

/**
 * If the value exists, use rule to vaildate. If not exists, ignore this rule.
 * @param {*} rule 
 */
export const IfExists = function(rule) {
  if (isInstanceOf(rule, Rule)) {
    return new Rule('IfExists', function(value) {
      if (value === undefined) {
        return null
      }
      let error = rule.vaildate(value)
      return xError(error, { target: value, rule, type: this.name })
    })
  }
  
  if (isInstanceOf(rule, Type)) {
    return new Rule('IfExists', function(value) {
      if (value === undefined) {
        return null
      }
      let error = rule.catch(value)
      return xError(error, { target: value, rule, type: this.name })
    })
  }

  rule = new Type(rule)
  return IfExists(rule)
}

/**
 * If the value not match rule, use defaultValue as value.
 * Notice, this will modify original data, which may cause error, so be careful.
 * @param {*} rule 
 * @param {*} defaultValue 
 */
export const IfNotMatch = function(rule, defaultValue) {
  if (isInstanceOf(rule, Rule)) {
    return new Rule('IfNotMatch', function(value) {
      let error = rule.vaildate(value)
      return xError(error, { target: value, rule, type: this.name })
    }, function(error, target, prop) {
      if (error) {
        target[prop] = defaultValue
      }
    })
  }
  
  if (isInstanceOf(rule, Type)) {
    return new Rule('IfNotMatch', function(value) {
      let error = rule.catch(value)
      return xError(error, { target: value, rule, type: this.name })
    }, function(error, target, prop) {
      if (error) {
        target[prop] = defaultValue
      }
    })
  }

  rule = new Type(rule)
  return IfNotMatch(rule, defaultValue)
}

/**
 * Whether the value is an instance of given class
 * @param {*} rule should be a class constructor
 */
export const InstanceOf = function(rule) {
  return new Rule('InstanceOf', function(value) {
    if (isInstanceOf(value, rule) && isInstanceOf(value, rule, true)) {
      return null
    }
    else {
      return new HelloTypeError('rule.instanceof', { target: value, rule, type: this.name })
    }
  })
}

/**
 * Whether the value is eqaul to the given value
 * @param {*} rule 
 */
export const Equal = function(rule) {
  return new Rule('Equal', function(value) {
    if (value === rule) {
      return null
    }
    else {
      return new HelloTypeError('rule.equal', { target: value, rule, type: this.name })
    }
  })
}

export const Lambda = function(InputRule, OutputRule) {
  return new Rule('Lambda', function(value) {
    if (!isFunction(value)) {
      return new HelloTypeError('rule.lambda.function', { target: value, rule, type: this.name })
    }
  }, function(error, target, prop) {
    if (!error) {
      let fn = target[prop].bind(target)
      let InputType = new Type(InputRule)
      let OutputType = new Type(OutputRule)
      let lambda = function(...args) {
        InputType.assert(...args)
        let result = fn.call(this, ...args)
        OutputType.assert(result)
        return result
      }
      target[prop] = lambda
    }
  })
}
