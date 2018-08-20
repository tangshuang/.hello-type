import Type from './type'
import { xError } from './utils'

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
 * If the value exists, use target to vaildate. If not exists, ignore this rule.
 * @param {*} target 
 */
export const IfExists = function(target) {
  if (target instanceof Rule) {
    let rule = target.clone()
    rule.if_exists = true
    return rule
  }
  
  if (target instanceof Type) {
    let rule = new Rule(function(value) {
      let error = target.catch(value)
      return xError(error, [value], [target])
    })
    rule.extends = function() {}
    return rule
  }

  target = new Type(target)
  return IfExists(target)
}

/**
 * If the value not match target, use defaultValue as value.
 * @param {*} target 
 * @param {*} defaultValue 
 */
export const IfNotMatch = function(target, defaultValue) {
  if (target instanceof Rule) {
    let rule = target.clone()
    rule.if_not_match = true
    rule.default_value = defaultValue
    return rule
  }
  
  if (target instanceof Type) {
    let rule = new Rule(function(value) {
      let error = target.catch(value)
      return xError(error, [value], [target])
    })
    rule.if_not_match = true
    rule.default_value = defaultValue
    return rule
  }

  target = new Type(target)
  return IfNotMatch(target)
}

/**
 * Whether the value is an instance of given class
 * @param {*} target should be a class constructor
 */
export const InstanceOf = function(target) {
  return new Rule(function(value) {
    if (value instanceof target && value.constructor === target) {
      return null
    }
    else {
      let error = new Error('argument is not an instance of ' + target.name)
      return xError(error, [value], [target])
    }
  })
}

/**
 * Whether the value is eqaul to the given value
 * @param {*} target 
 */
export const Equal = function(target) {
  return new Rule(function(value) {
    if (value === target) {
      return null
    }
    else {
      let error = new Error('argument does not equal target')
      return xError(error, [value], [target])
    }
  })
}
