import Type from './type'
import { isFunction, xError } from './utils'
import HelloType from './hello-type'

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
}

export const Null = new Rule(value => value === null)
export const Undefined = new Rule(value => value === undefined)
export const Any = new Rule(() => null)

/**
 * If the value exists, use rule to vaildate. If not exists, ignore this rule.
 * @param {*} rule 
 */
export const IfExists = function(rule) {
  if (rule instanceof Rule) {
    return new Rule('IfExists', function(value) {
      if (value === undefined) {
        return null
      }
      let error = rule.vaildate(value)
      return xError(error, { value, rule, name: 'IfExists' })
    })
  }
  
  if (rule instanceof Type) {
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
  if (rule instanceof Rule) {
    return new Rule('IfNotMatch', function(value) {
      let error = rule.vaildate(value)
      return xError(error, { value, rule, name: 'IfNotMatch' })
    }, function(error, target, prop) {
      if (error) {
        target[prop] = defaultValue
      }
    })
  }
  
  if (rule instanceof Type) {
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
    if (value instanceof rule && value.constructor === rule) {
      return null
    }
    else {
      let error = new Error('argument is not an instance of ' + (rule.name || 'unknow'))
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
      let error = new Error('argument does not equal rule')
      return xError(error, { value, rule, name: 'Equal' })
    }
  })
}

export const Lambda = function(InputRule, OutputRule) {
  return new Rule('Lambda', function(value) {
    if (!isFunction(value)) {
      let error = new Error('%value should be a function')
      return xError(error, { value, name: 'Lambda' })
    }
  }, function(error, target, prop) {
    if (!error) {
      let fn = target[prop].bind(target)
      let InputType = new Type(InputRule)
      let OutputType = new Type(OutputRule)
      let lambda = function(...args) {
        HelloType.expect(...args).toMatch(InputType)
        let result = fn(...args)
        HelloType.expect(...args).toMatch(OutputType)
        return result
      }
      target[prop] = lambda
    }
  })
}
