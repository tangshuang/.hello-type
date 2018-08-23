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

import { decorate, isInstanceOf, isObject, inObject, xError, clone, inArray } from './utils'
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
      function getRuleType(rule) {
        return isInstanceOf(rule, Type) ? rule : new Type(rule)
      }
      function getRule(rule) {
        let type = getRuleType(rule)
        return type.rules[0]
      }

      if (!isObject(target)) {
        let error = new TypeError('%target should be an object')
        let e = xError(error, { target, type })
        HelloType.throwError(e)
      }

      let rule = getRule(type)
      if (!isObject(rule)) {
        let error = new TypeError('%rule should be an object')
        let e = xError(error, { obj, prop, value, rule, type, target, action: 'define.by' })
        HelloType.throwError(e)
      }

      function xclone(origin, rule) {
        let result = {}
        let rules = getRule(rule)
        let ruleKeys = Object.keys(rules)
        let propKeys = Object.keys(origin)
        
        ruleKeys.forEach((key) => {
          let propValue = origin[key]
          let propRule = getRule(rules[key])

          if (isObject(propRule)) {
            if (isObject(propValue)) {
              result[key] = xclone(propValue, propRule)
            }
            // if prop rule is an object, and the prop is undefined, I will set it to rule structure
            else if (propValue === undefined) {
              result[key] = xclone({}, propRule)
            }
            // if original prop value is not an object but should be an object called by rule
            else {
              let error = new TypeError('%propValue should be an object')
              let e = xError(error, { origin, rule, key, propValue, propRule, type, target, action: 'define.by' })
              HelloType.throwError(e)

              result[key] = propValue
            }
          }
          else {
            if (propValue === undefined) {
              result[key] = undefined
            }
            else if (Array.isArray(propValue)) {
              result[key] = [].concat(propValue)
            }
            else {
              result[key] = propValue
            }
          }
        })

        propKeys.forEach((key) => {
          if (!inObject(key, result)) {
            result[key] = origin[key]
          }
        })

        return result
      }

      function xproxy(origin, rule) {
        let parents = []
        let generate = function(origin, rule) {
          parents.push(origin)

          let keys = Object.keys(origin)
          keys.forEach((key) => {
            let propRule = getRule(rule[key])
            let propValue = origin[key]

            if (isObject(propValue) && isObject(propRule)) {
              if (inArray(propValue, parents)) {
                origin[key] = propValue
              }
              else {
                origin[key] = xproxy(propValue, propRule)
              }
            }
          })

          return new Proxy(origin, {
            set(obj, key, value) {
              // if given type to check, use it
              let propRule = rule[key]
              if (propRule) {
                let PropType = getRuleType(propRule)
                let error = HelloType.expect(value).toBeCatchedBy(PropType)
                if (error) {
                  let e = xError(error, { origin, rule, key, value, propRule, type, target, action: 'define.by' })
                  HelloType.throwError(e)
                }
                
                // if value is object, should make proxy too
                let proprule = PropType.rules[0]
                if (isObject(value) && isObject(proprule)) {
                  value = xclone(value, proprule)
                  value = clone(value)
                  value = xproxy(value, proprule)
                }
              }

              obj[key] = value
              return true
            },
          })
        }

        let proxy = generate(origin, rule)
        parents = null
        return proxy
      }

      let xcloned = xclone(target, rule)
      let cloned = clone(xcloned)
      let proxy = xproxy(cloned, rule)
      return proxy
    },
  }),
}

export default HelloType
