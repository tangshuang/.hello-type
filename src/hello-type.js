export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export {
  default as Rule,
  Any, Null, Undefined,
  IfExists, IfNotMatch, IfExistsNotMatch,
  Equal, InstanceOf, Lambda,
  Validate,
} from './rule'

import { decorate, isInstanceOf, isObject, inObject, clone, inArray, isFunction } from './utils'
import Type from './type'
import { xError, HelloTypeError } from './error'

const HelloTypeListeners = []

export const HelloType = {
  /**
   * @example
   * HelloType.expect(10).to.match(Number)
   */
  expect: (...targets) => ({
    to: {
      match: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        try {
          type.assert(...targets)
          return true
        }
        catch(e) {
          HelloType.throwError(e)
          return false
        }
      },
    },
    /**
     * @alias HelloType.expect.to.match
     */
    match: (type) => HelloType.expect(...targets).to.match(type),
  }),

  /**
   * @example
   * let error = HelloType.catch(10).by(Number)
   */
  catch: (...targets) => ({
    by: (type) => {
      if (!isInstanceOf(type, Type)) {
        type = new Type(type)
      }

      let error = type.catch(...targets)
      if (error) {
        HelloType.dispatch(error, 'catch')
      }
      return error
    },
  }),

  /**
   * @example
   * HelloType.trace('10').by(Number).with(error => console.log(error.stack))
   */
  trace: (...targets) => ({
    by: (type) => {
      if (!isInstanceOf(type, Type)) {
        type = new Type(type)
      }

      let defer = type.trace(...targets).with((error) => {
        HelloType.dispatch(error, 'trace')
        return error
      })
      return {
        with: (fn) => defer.then((error) => {
          if (error && isFunction(fn)) {
            fn(error, targets, type)
          }
          return error
        }),
      }
    },
  }),

  /**
   * @example
   * HelloType.track('10').by(Number).with(error => console.log(error.stack))
   */
  track: (...targets) => ({
    by: (type) => {
      if (!isInstanceOf(type, Type)) {
        type = new Type(type)
      }

      let defer = type.track(...targets).with((error) => {
        HelloType.dispatch(error, 'track')
        return error
      })
      return {
        with: (fn) => defer.then((error) => {
          if (error && isFunction(fn)) {
            fn(error, targets, type)
          }
          return error
        }),
      }
    },
  }),

  /**
   * determine whether type match
   * @example
   * let bool = HelloType.is(Number).typeof(10)
   * let bool = HelloType.is(10).of(Number)
   */
  is: (...args) => ({
    typeof: (...targets) => {
      let type = args[0]
      if (!isInstanceOf(type, Type)) {
        type = new Type(type)
      }

      let error = type.catch(...targets)
      if (error) {
        HelloType.dispatch(error, 'test')
        return false
      }
      else {
        return true
      }
    },
    of: (type) => HelloType.is(type).typeof(...args),
  }),

  /**
   * @example
   * @HelloType.decorate.with((target) => SomeType.assertf(target))
   */
  decorate: {
    input: {
      with: (factor) => decorate(function(...args) {
        if (isFunction(factor)) {
          factor(...args)
        }
        else if (isInstanceOf(factor, Type)) {
          HelloType.expect(...args).to.match(factor)
        }
      }, 'input'),
    },
    output: {
      with: (factor) => decorate(function(...args) {
        if (isFunction(factor)) {
          factor(...args)
        }
        else if (isInstanceOf(factor, Type)) {
          HelloType.expect(...args).to.match(factor)
        }
      }, 'output'),
    },
    with: (factor) => decorate(function(...args) {
      if (isFunction(factor)) {
        factor(...args)
      }
      else if (isInstanceOf(factor, Type)) {
        HelloType.expect(...args).to.match(factor)
      }
    }),
  },

  bind: (fn) => {
    if (isFunction(fn)) {
      HelloTypeListeners.push(fn)
    }
  },
  unbind: (fn) => {
    let i = 0
    let len = HelloTypeListeners.length
    for (; i < len; i ++) {
      let item = HelloTypeListeners[i]
      if (item === fn) {
        HelloTypeListeners.splice(i, 1)
        i --
        len = HelloTypeListeners.length
      }
    }
  },
  dispatch: (error, action) => {
    if (HelloTypeListeners.length) {
      HelloTypeListeners.forEach((fn) => {
        Promise.resolve().then(() => {
          fn(error, action)
        })
      })
    }
  },

  /**
   * whether to use console.error instead of throw when using HelloType.expect.to.match
   */
  set Slient(value) {
    HelloType.slient = value
  },
  get Slient() {
    return HelloType.slient
  },
  slient: false,
  throwError(e) {
    HelloType.dispatch(e, 'assert')

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
        let error = new HelloTypeError('hello.define.target.object', { target, type })
        HelloType.throwError(error)
      }

      let rule = getRule(type)
      if (!isObject(rule)) {
        let error = new HelloTypeError('hello.define.rule.object', { target, type, rule })
        HelloType.throwError(error)
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
              let error = new HelloTypeError('hello.define.property.object', {
                target,
                type,
                origin,
                rule,
                prop: key,
                value: propValue,
                propRule,
                action: 'define.by',
              })
              HelloType.throwError(error)

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
                let error = HelloType.catch(value).by(PropType)
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
