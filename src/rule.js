import Type from './type'
import { isFunction, xError, stringify, isInstanceOf } from './utils'
import { criticize } from './messages'

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

export const Null = new Rule('Null', (value) => {
  if (value !== null) {
    let message = criticize('rule.null', {
      arg: stringify(value),
    })
    let error = new TypeError(message)
    return xError(error, { value, name: 'Null' })
  }
})
export const Undefined = new Rule('Undefined', (value) => {
  if (value !== undefined) {
    let message = criticize('rule.undefined', {
      arg: stringify(value),
    })
    let error = new TypeError(message)
    return xError(error, { value, name: 'Undefined' })
  }
})
export const Any = new Rule(() => null)

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
        let error = new TypeError(msg)
        return xError(error, { value, rule, name: 'Verify' })
      }
    })
  }
  else {
    let type = new Type(rule)
    return new Rule('Verify', function(value) {
      if (!type.test(value)) {
        let msg = isFunction(message) ? message(value) : message
        let error = new TypeError(msg)
        return xError(error, { value, rule, name: 'Verify' })
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
      return xError(error, { value, rule, name: 'IfExists' })
    })
  }
  
  if (isInstanceOf(rule, Type)) {
    return new Rule('IfExists', function(value) {
      if (value === undefined) {
        return null
      }
      let error = rule.catch(value)
      return xError(error, { value, rule, name: 'IfExists' })
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
      return xError(error, { value, rule, name: 'IfNotMatch' })
    }, function(error, target, prop) {
      if (error) {
        target[prop] = defaultValue
      }
    })
  }
  
  if (isInstanceOf(rule, Type)) {
    return new Rule('IfNotMatch', function(value) {
      let error = rule.catch(value)
      return xError(error, { value, rule, name: 'IfNotMatch' })
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
      let message = criticize('rule.instanceof', {
        arg: stringify(value),
        rule: rule.name || 'unknow',
      })
      let error = new TypeError(message)
      return xError(error, { value, rule, name: 'InstanceOf' })
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
      let message = criticize('rule.equal', {
        arg: stringify(value),
        rule: rule.name || 'unknow',
      })
      let error = new TypeError(message)
      return xError(error, { value, rule, name: 'Equal' })
    }
  })
}

export const Lambda = function(InputRule, OutputRule) {
  return new Rule('Lambda', function(value) {
    if (!isFunction(value)) {
      let message = criticize('rule.lambda.function', {
        arg: stringify(value),
      })
      let error = new TypeError(message)
      return xError(error, { value, name: 'Lambda' })
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
