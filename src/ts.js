import { decorate, isInstanceOf, isObject, inObject, clone, inArray, isFunction } from './utils.js'
import Type from './type.js'
import TsError, { makeError } from './error.js'

export class Ts {
  constructor() {
    this._listeners = []
    this._silent = false
  }

  bind(fn) {
    if (isFunction(fn)) {
      this._listeners.push(fn)
    }
    return this
  }
  unbind(fn) {
    this._listeners.forEach((item, i) => {
      if (item === fn) {
        this._listeners.splice(i, 1)
      }
    })
    return this
  }
  dispatch(error) {
    this._listeners.forEach((fn) => {
      Promise.resolve().then(() => fn(error))
    })
    return this
  }

  silent(value) {
    this._silent = value
  }
  throw(error) {
    this.dispatch(error)

    if (this._silent) {
      console.error(error)
    }
    else {
      throw error
    }
  }

  /**
   * @example
   * ts.expect(10).to.match(Number)
   */
  expect(...targets) {
    return {
      to: {
        match: (type) => {
          if (!isInstanceOf(type, Type)) {
            type = new Type(type)
          }

          try {
            type.assert(...targets)
            return true
          }
          catch (e) {
            this.throw(e)
            return false
          }
        },
        be: (type) => {
          return this.expect(...targets).to.match(type)
        },
      },
    }
  }

  /**
   * @example
   * let error = ts.catch(10).by(Number)
   */
  catch(...targets) {
    return {
      by: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        let error = type.catch(...targets)
        if (error) {
          this.dispatch(error)
        }
        return error
      },
    }
  }

  /**
   * @example
   * ts.trace('10').by(Number).with(error => console.log(error.stack))
   */
  trace(...targets) {
    return {
      by: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        let defer = type.trace(...targets).with((error) => {
          this.dispatch(error)
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
    }
  }

  /**
   * @example
   * ts.track('10').by(Number).with(error => console.log(error.stack))
   */
  track(...targets) {
    return {
      by: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        let defer = type.track(...targets).with((error) => {
          this.dispatch(error)
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
    }
  }

  /**
   * determine whether type match
   * @example
   * let bool = ts.is(Number).typeof(10)
   * let bool = ts.is(10).of(Number)
   */
  is(...args) {
    return {
      typeof: (...targets) => {
        let type = args[0]
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        let error = type.catch(...targets)
        if (error) {
          this.dispatch(error)
          return false
        }
        else {
          return true
        }
      },
      of: (type) => this.is(type).typeof(...args),
    }
  }

  /**
   * @param {string|undefined} which input|output
   * @example
   * @ts.decorate('input').with((target) => SomeType.assertf(target))
   */
  decorate(which) {
    return {
      with: (factor) => decorate(function(...args) {
        if (isFunction(factor)) {
          factor(...args)
        }
        else if (isInstanceOf(factor, Type)) {
          this.expect(...args).to.match(factor)
        }
      }, which),
    }
  }

  define(target) {
    function getRuleType(rule) {
      return isInstanceOf(rule, Type) ? rule : new Type(rule)
    }
    function getRule(rule) {
      let type = getRuleType(rule)
      return type.rules[0]
    }

    if (!isObject(target)) {
      let error = new TsError('define should recieve a object.', { target, type, level: 'define.by' })
      this.throw(error)
    }

    return {
      by: (type) => {
        let rule = getRule(type)
        if (!isObject(rule)) {
          let error = new TsError('object should be defined by a dict.', { target, type, rule, level: 'define.by' })
          this.throw(error)
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
                let error = new TsError('object property should be by a object required by {should}.', {
                  target,
                  type,
                  origin,
                  rule,
                  prop: key,
                  value: propValue,
                  propRule,
                  level: 'define.by',
                })
                this.throw(error)

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
                  let error = this.catch(value).by(PropType)
                  if (error) {
                    let e = makeError(error, { origin, rule, key, value, propRule, type, target, level: 'define.by' })
                    this.throw(e)
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
    }
  }

}

export const ts = new Ts()
Ts.expect = ts.expect.bind(ts)
Ts.catch = ts.catch.bind(ts)
Ts.trace = ts.trace.bind(ts)
Ts.track = ts.track.bind(ts)
Ts.is = ts.is.bind(ts)
Ts.decorate = ts.decorate.bind(ts)
Ts.define = ts.define.bind(ts)

export default Ts
