import Rule from './rule.js'
import TsError, { makeError } from './error.js'
import { isArray, isBoolean, isNumber, isObject, isNaN, isString, isFunction, isSymbol, isConstructor, isInstanceOf } from './utils.js'

import Dict from './dict.js'
import List from './list.js'

export class Type {

  /**
   * create a Type instance
   * @param  {Any} pattern should be native prototypes or a Rule instance, i.e. String, Number, Boolean... Null, Any, Float...
   */
  constructor(pattern) {
    this.mode = 'none'
    this.name = 'Type'
    this.pattern = pattern
  }

  /**
   * validate whether the argument match the pattern
   * @param {*} value
   * @param {*} pattern
   */
  validate(value, pattern) {
    const info = { value, pattern, type: this, level: 'type', action: 'validate' }
    // custom pattern
    // i.e. (new Type(new Rule(value => typeof value === 'object'))).assert(null)
    if (isInstanceOf(pattern, Rule)) {
      let error = pattern.validate(value)
      return makeError(error, info)
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (typeof pattern === 'number' && isNaN(pattern)) {
      if (typeof value === 'number' && isNaN(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // Number
    // i.e. (new Type(Number).assert(1))
    if (pattern === Number) {
      if (isNumber(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // Boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (pattern === Boolean) {
      if (isBoolean(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // String
    // i.e. (new Type(String)).assert('name')
    if (pattern === String) {
      if (isString(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // regexp
    // i.e. (new Type(/a/)).assert('name')
    if (isInstanceOf(pattern, RegExp)) {
      if (!isString(value)) {
        return new TsError('mistaken', info)
      }
      if (pattern.test(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // Function
    // i.e. (new Type(Function)).assert(() => {})
    if (pattern === Function) {
      if (isFunction(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // Array
    // i.e. (new Type(Array)).assert([])
    if (pattern === Array) {
      if (isArray(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    // object
    // i.e. (new Type(Object).assert({}))
    if (pattern === Object) {
      if (isObject(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    if (pattern === Symbol) {
      if (isSymbol(value)) {
        return null
      }
      else {
        return new TsError('mistaken', info)
      }
    }

    if (isArray(pattern)) {
      let ListType = new List(pattern)
      let error = ListType.catch(value)
      return makeError(error, info)
    }

    if (isObject(pattern)) {
      let DictType = new Dict(pattern)
      let error = DictType.catch(value)
      return makeError(error, info)
    }

    // instance of a class
    // i.e. (new Type(Person)).assert(person)
    if (isConstructor(pattern) && isInstanceOf(value, pattern)) {
      return null
    }

    // instance of Type
    // (new Type(new Type(Array))).assert([{ name: 'Hamlet', price: 120.34 }])
    if (isInstanceOf(pattern, Type)) {
      if (this.mode === 'strict') {
        pattern = pattern.strict
      }
      let error = pattern.catch(value)
      return makeError(error, info)
    }

    // is the given value, pattern should not be an object/instance
    // i.e. (new Type('name')).assert('name')
    if (value === pattern) {
      return null
    }

    return new TsError('mistaken', info)
  }

  assert(value) {
    const pattern = this.pattern
    const info = { value, pattern, type: this, level: 'type', action: 'assert' }
    const error = this.validate(value, pattern)
    if (error) {
      throw makeError(error, info)
    }
  }
  catch(value) {
    try {
      this.assert(value)
      return null
    }
    catch (error) {
      return error
    }
  }
  test(value) {
    let error = this.catch(value)
    return !error
  }

  /**
   * track value with type sync
   * @param {*} value
   */
  track(value) {
    return new Promise((resolve, reject) => {
      let error = this.catch(value)
      if (error) {
        reject(error)
      }
      else {
        resolve()
      }
    })
  }

  /**
   * track value with type async
   * @param {*} value
   */
  trace(value) {
    return new Promise((resolve, reject) => {
      Promise.resolve().then(() => {
        let error = this.catch(value)
        if (error) {
          reject(error)
        }
        else {
          resolve()
        }
      })
    })
  }

  toBeStrict(mode = true) {
    this.mode = mode ? 'strict' : 'none'
    return this
  }
  get strict() {
    const Constructor = Object.getPrototypeOf(this).constructor
    const ins = new Constructor(...this.patterns)
    ins.toBeStrict()

    let keys = Object.keys(this)
    keys.forEach((key) => {
      ins[key] = this[key]
    })

    return ins
  }
  get Strict() {
    return this.strict
  }

  // use name when convert to string
  toString() {
    return this.name
  }

}

export function type(pattern) {
  const type = new Type(pattern)
  return type
}

export default Type
