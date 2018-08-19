import Type from './type'

export default class Rule {
  constructor(factory) {
    this.factory = factory
  }
}

export const Null = new Rule(value => value === null)

export const Undefined = new Rule(value => value === undefined)

export const Any = new Rule(() => null)

/**
 * If value is not exists, ignore type check. Or use pattern to vaildate.
 * @param {*} pattern 
 */
export const IfExists = function(pattern) {
  if (!(pattern instanceof Rule) && !(pattern instanceof Type)) {
    pattern = new Type(pattern)
  }
  pattern.if_exists = true
  return pattern
}

/**
 * Whether the value is an instance of given class
 * @param {*} pattern should be a class constructor
 */
export const InstanceOf = function(pattern) {
  return new Rule(function(arg) {
    if (arg instanceof pattern && arg.constructor === pattern) {
      return null
    }
    else {
      let error = new Error('argument is not an instance of ' + pattern.name)
      error.arguments = [arg]
      error.pattern = pattern
      return error
    }
  })
}

/**
 * Whether the value is eqaul to the given value
 * @param {*} pattern 
 */
export const Equal = function(pattern) {
  return new Rule(function(arg) {
    if (arg === pattern) {
      return null
    }
    else {
      let error = new Error('argument does not equal pattern')
      error.arguments = [arg]
      error.pattern = pattern
      return error
    }
  })
}
