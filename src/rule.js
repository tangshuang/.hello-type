import Type from './type'
import { xError, inObject } from './utils'

export default class Rule {
  constructor(factory) {
    this.factory = factory
  }
  clone() {
    return new Rule(this.factory)
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
    return new Rule(function(value, prop, target) {
      if (!inObject(prop, target)) {
        return null
      }
      let error = rule.factory(value)
      return xError(error, [value], [rule])
    })
  }
  
  if (rule instanceof Type) {
    return new Rule(function(value, prop, target) {
      if (!inObject(prop, target)) {
        return null
      }
      let error = rule.catch(value)
      return xError(error, [value], [rule])
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
    return new Rule(function(value, prop, target) {
      let error = rule.factory(value)
      if (error) {
        target[prop] = defaultValue
      }
      return null
    })
  }
  
  if (rule instanceof Type) {
    return new Rule(function(value, prop, target) {
      let error = rule.catch(value)
      if (error) {
        target[prop] = defaultValue
      }
      return null
    })
  }

  rule = new Type(rule)
  return IfNotMatch(rule)
}

/**
 * Whether the value is an instance of given class
 * @param {*} rule should be a class constructor
 */
export const InstanceOf = function(rule) {
  return new Rule(function(value) {
    if (value instanceof rule && value.constructor === rule) {
      return null
    }
    else {
      let error = new Error('argument is not an instance of ' + rule.name)
      return xError(error, [value], [rule])
    }
  })
}

/**
 * Whether the value is eqaul to the given value
 * @param {*} rule 
 */
export const Equal = function(rule) {
  return new Rule(function(value) {
    if (value === rule) {
      return null
    }
    else {
      let error = new Error('argument does not equal rule')
      return xError(error, [value], [rule])
    }
  })
}
