import Rule, { Any } from './rule'
import Dict from './dict'
import List from './list'
import Enum from './enum'
import {
  isArray, inArray, isBoolean, isNumber, isObject, isNaN,
  isString, isFunction, isSymbol, isConstructor, isInstanceOf,
  toShallowObject,
  defineProperty,
} from './utils'
import { xError, HelloTypeError } from './error'

export default class Type {
  constructor(...patterns) {
    defineProperty(this, 'id', Date.now()  + '.' + parseInt(Math.random() * 10000))
    defineProperty(this, 'mode', 'none', true)
    defineProperty(this, 'name', 'Type', true, true)
    defineProperty(this, 'patterns', patterns)

    let rules = patterns.map((rule) => {
      if (isObject(rule)) {
        // if rule is an object, it will be converted to be a shallow object
        // if the value of a property is an object, it will be converted to be a Dict
        // if the value of a property is an array, it will be converted to be a List
        return toShallowObject(rule, item => isObject(item) ? Dict(item) : isArray(item) ? List(item) : item)
      }
      // if rule is an array, it will be converted to be a 'List'
      else if (isArray(rule)) {
        return rule.map(item => isObject(item) ? Dict(item) : isArray(item) ? List(item) : item)
      }
      else {
        return rule
      }
    })
    defineProperty(this, 'rules', rules)
  }
  /**
   * vaildate whether the argument match the rule
   * @param {*} target
   * @param {*} rule
   */
  vaildate(target, rule) {
    // custom rule
    // i.e. (new Type(new Rule(value => typeof value === 'object'))).assert(null)
    if (isInstanceOf(rule, Rule)) {
      let error = rule.vaildate(target)
      return xError(error, { target, type: this })
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (typeof rule === 'number' && isNaN(rule)) {
      if (typeof target === 'number' && isNaN(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.NaN', { target, type: rule })
      }
    }

    // Number
    // i.e. (new Type(Number).assert(1))
    if (rule === Number) {
      if (isNumber(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.Number', { target, type: rule })
      }
    }

    // Boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (rule === Boolean) {
      if (isBoolean(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.Boolean', { target, type: rule })
      }
    }

    // String
    // i.e. (new Type(String)).assert('name')
    if (rule === String) {
      if (isString(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.String', { target, type: rule })
      }
    }

    // regexp
    // i.e. (new Type(/a/)).assert('name')
    if (isInstanceOf(rule, RegExp)) {
      if (!isString(target)) {
        return new HelloTypeError('type.regexp.string', { target, type: rule })
      }
      if (rule.test(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.regexp', { target, type: rule })
      }
    }

    // Function
    // i.e. (new Type(Function)).assert(() => {})
    if (rule === Function) {
      if (isFunction(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.Function', { target, type: rule })
      }
    }

    // Array
    // i.e. (new Type(Array)).assert([])
    if (rule === Array) {
      if (isArray(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.Array', { target, type: rule })
      }
    }

    // object
    // i.e. (new Type(Object).assert({}))
    if (rule === Object) {
      if (isObject(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.Object', { target, type: rule })
      }
    }

    if (rule === Symbol) {
      if (isSymbol(target)) {
        return null
      }
      else {
        return new HelloTypeError('type.Symbol', { target, type: rule })
      }
    }

    if (isArray(rule) && isArray(target)) {
      let rules = rule
      let targets = target
      let ruleLength = rules.length
      let targetLength = targets.length

      // array length should equal in strict mode
      if (this.mode === 'strict') {
        if (ruleLength !== targetLength) {
          return new HelloTypeError('type.strict.array.length', { target, ruleLength, targetLength, type: rule })
        }
      }

      // if arguments.length is bigger than rules.length, use Enum to match left items
      let index = 0
      for (let i = 0; i < ruleLength; i ++) {
        let target = targets[i]
        let rule = rules[i]

        if (isInstanceOf(rule, Rule)) {
          let error = rule.vaildate(target)

          // use rule to override property when not match
          // override value and check again
          if (isFunction(rule.override)) {
            target = rule.override(error, i, targets) || targets[i]
            error = rule.vaildate(target)
          }

          if (error) {
            return xError(error, { target, index: i, items: targets, type: this })
          }
          else {
            continue
          }
        }

        // normal vaildate
        let error = this.vaildate(target, rule)
        if (error) {
          return xError(error, { target, rule, index: i, items: targets, type: this })
        }

        index = i
      }
      // if target length is greater than rule length
      if (ruleLength && targetLength > ruleLength) {
        let RestType = ruleLength > 1 ? Enum(...rules) : rules[0]
        for (let i = index+1; i < targetLength; i ++) {
          let target = targets[i]
          // normal vaildate
          let error = this.vaildate(target, RestType)
          if (error) {
            return xError(error, { target, index: i, items: targets, type: this })
          }
        }
      }

      return null
    }

    if (isObject(rule) && isObject(target)) {
      let rules = rule
      let targets = target
      let ruleKeys = Object.keys(rules).sort()
      let targetKeys = Object.keys(targets).sort()

      if (this.mode === 'strict') {
        // properties should be absolutely same
        for (let i = 0, len = targetKeys.length; i < len; i ++) {
          let key = targetKeys[i]
          // targets has key beyond rules
          if (!inArray(key, ruleKeys)) {
            return new HelloTypeError('type.strict.object.key.overflow', { target, rule, key, ruleKeys, node: targets, type: this })
          }
        }
      }

      for (let i = 0, len = ruleKeys.length; i < len; i ++) {
        let key = ruleKeys[i]
        let rule = rules[key]
        let target = targets[key]

        // not found some key in target
        // i.e. should be { name: String, age: Number } but give { name: 'tomy' }, 'age' is missing
        if (!inArray(key, targetKeys)) {
          // IfExists:
          if (isInstanceOf(rule, Rule) && this.mode !== 'strict') {
            let error = rule.vaildate(target)

            // use rule to override property when not exists
            // override value and check again
            if (isFunction(rule.override)) {
              target = rule.override(error, key, targets) || targets[key]
              error = rule.vaildate(target)
            }

            if (!error) {
              continue
            }
          }

          return new HelloTypeError('type.object.key.missing', { target, rule, key, ruleKeys, node: targets, type: this })
        }

        if (isInstanceOf(rule, Rule)) {
          let error = rule.vaildate(target)

          // use rule to override property when not match
          // override value and check again
          if (isFunction(rule.override)) {
            target = rule.override(error, key, targets) || targets[key]
            error = rule.vaildate(target)
          }

          if (error) {
            return xError(error, { target, key, type: this })
          }
          else {
            continue
          }
        }

        // normal vaildate
        let error = this.vaildate(target, rule)
        if (error) {
          return xError(error, { target, key, type: this })
        }
      }

      return null
    }

    // is the given value, rule should not be an object/instance
    // i.e. (new Type('name')).assert('name')
    if (!isInstanceOf(rule, Object) && target === rule) {
      return null
    }

    // instance of a class
    // i.e. (new Type(Person)).assert(person)
    if (isConstructor(rule) && isInstanceOf(target, rule)) {
      return null
    }

    // instance of Type
    // const BooksType = List(BookType)
    // BooksType.assert([{ name: 'Hamlet', price: 120.34 }])
    if (isInstanceOf(rule, Type)) {
      if (this.mode === 'strict') {
        rule = rule.strict
      }
      let error = rule.catch(target)
      if (error) {
        return xError(error, { target, type: this.name })
      }

      return null
    }

    return new HelloTypeError('type', { target, type: rule })
  }
  assert(...targets) {
    let rules = this.rules

    if (targets.length !== rules.length) {
      throw new HelloTypeError('type.arguments.length', { target: 'arguments', type: this, ruleLength: this.rules.length })
    }

    for (let i = 0, len = targets.length; i < len; i ++) {
      let target = targets[i]
      let rule = rules[i]
      let error = this.vaildate(target, rule)
      if (error) {
        throw xError(error, { target, type: rule })
      }
    }
  }
  catch(...targets) {
    try {
      this.assert(...targets)
      return null
    }
    catch(error) {
      return error
    }
  }
  test(...targets) {
    let error = this.catch(...targets)
    return !error
  }

  /**
   * track targets with type sync
   * @param {*} targets
   */
  track(...targets) {
    let error = this.catch(...targets)
    let defer = Promise.resolve(error)
    return {
      with: (fn) => defer.then((error) => {
        if (error && isFunction(fn)) {
          fn(error, targets, this)
        }
        return error
      }),
    }
  }

  /**
   * track targets with type async
   * @param {*} targets
   * @example
   * SomeType.trace(target).with((error, [target], type) => { ... })
   */
  trace(...targets) {
    let defer = new Promise((resolve) => {
      Promise.resolve().then(() => {
        let error = this.catch(...targets)
        resolve(error)
      })
    })
    return {
      with: (fn) => defer.then((error) => {
        if (error && isFunction(fn)) {
          fn(error, targets, this)
        }
        return error
      }),
    }
  }

  toBeStrict(mode = true) {
    this.mode = mode ? 'strict' : 'none'
    return this
  }
  get strict() {
    let ins = new Type(...this.patterns)
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
