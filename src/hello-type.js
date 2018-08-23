export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { 
  default as Rule, 
  Any, Null, Undefined, 
  IfExists, IfNotMatch, Equal, InstanceOf, Lambda,
} from './rule'

import { decorate, isInstanceOf, isObject, xError } from './utils'
import Type from './type'

export const HelloType = {
  /**
   * assert
   * @param {Type} type 
   * @example
   * HelloType.expect(arg).toMatch(SomeType)
   */
  expect: (...targets) => ({
    toMatch: (type) => {
      try {
        type.assert(...targets)
        return true
      }
      catch(e) {
        HelloType.throwError(e)
        return false
      }
    },
    toBeCatchedBy: (type) => type.catch(...targets),
    toBeTracedBy: (type) => ({
      with: (fn) => type.trace(...targets).with(fn),
    }),
  }),

  /**
   * determine whether type match
   * @param {Type} type 
   * @example
   * let bool = HelloType.is(SomeType).typeof(arg)
   */
  is: (type) =>  ({
    typeof: (...targets) => type.test(...targets),
  }),

  /**
   * @example
   * @HelloType.decorate.with((arg) => SomeType.assertf(arg))
   */
  decorate: {
    input: {
      with: (fn) => decorate(function(...args) {
        fn(...args)
      }, 'input'),
    },
    output: {
      with: (fn) => decorate(function(...args) {
        fn(...args)
      }, 'output'),
    },
    with: (fn) => decorate(function(...args) {
      fn(...args)
    }),
  },

  /**
   * whether to use console.error instead of throw when using HelloType.expect.toMatch
   */
  slient: false,
  throwError(e) {
    if (HelloType.slient) {
      console.error(e)
    }
    else {
      throw e
    }
  },

  define: (target) => ({
    by: (type) => {
      return new Proxy(target, {
        set(obj, prop, value) {
          let TargetType = isInstanceOf(type, Type) ? type : new Type(type)
          let rule = TargetType.rules[0]
          // only works for object
          if (!isObject(rule)) {
            let error = new Error('%obj should not be object')
            let e = xError(error, { obj, prop, value, rule, type, target })
            HelloType.throwError(e)
          }

          // if given type to check, use it
          let proptype = rule[prop]
          if (proptype) {
            let PropType = isInstanceOf(proptype, Type) ? proptype : new Type(proptype)
            HelloType.expect(value).toMatch(PropType)
            
            // if value is object, should make proxy too
            let proprule = PropType.rules[0]
            if (isObject(value) && isObject(proprule)) {
              value = HelloType.define(value).by(PropType)
            }
          }

          obj[prop] = value
          return true
        },
      })
    },
  }),
}

export default HelloType
