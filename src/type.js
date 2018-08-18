import { isArray, isBoolean, isNumber, isObject, toShallowObject, isString, isFunction, isConstructor } from './utils'
import Rule, { Any } from './rule'
import Dict from './dict'
import List from './list'
import Enum from './enum'

export default class Type {
  constructor(...patterns) {
    this.id = Date.now()  + '.' + parseInt(Math.random() * 10000)
    this.mode = 'none'

    this.patterns = patterns
    this.rules = patterns.map((rule) => {
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
  }
  get strict() {
    let ins = new Type(...this.patterns)
    ins.mode = 'strict'
    return ins
  }
  get Strict() {
    return this.strict
  }
  vaildate(arg, rule, pattern) {
    // custom rule
    // i.e. (new Type(new Rule(value => typeof value === 'object'))).assert(null)
    if (rule instanceof Rule) {
      // if can be not exists
      if (rule.if_exists && typeof arg === 'undefined') {
        return null
      }

      if (!isFunction(rule.factory)) {
        let error = new Error('new Rule should receive a function')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
      else {
        let error = rule.factory(arg)
        if (error instanceof Error) {
          return error
        }
      }

      return null
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (typeof rule === 'number' && isNaN(rule)) {
      if (typeof arg === 'number' && isNaN(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(arg) + ' does not match NaN')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    // Number
    // i.e. (new Type(Number).assert(1))
    if (rule === Number) {
      if (isNumber(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(arg) + ' does not match Number')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    // Boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (rule === Boolean) {
      if (isBoolean(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(rule) + ' does not match Boolean')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    // String
    // i.e. (new Type(String)).assert('name')
    if (rule === String) {
      if (isString(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(arg) + ' does not match String')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    // Function
    // i.e. (new Type(Function)).assert(() => {})
    if (rule === Function) {
      if (isFunction(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(arg) + ' does not match Function')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    // Array
    // i.e. (new Type(Array)).assert([])
    if (rule === Array) {
      if (isArray(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(arg) + ' does not match Array')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    // object
    // i.e. (new Type(Object).assert({}))
    if (rule === Object) {
      if (isObject(arg)) {
        return null
      }
      else {
        let error = new Error(typeof(arg) + ' does not match Object')
        error.arguments = [arg]
        error.pattern = pattern
        return error
      }
    }

    if (isArray(rule) && isArray(arg)) {
      let rules = rule
      let args = arg
      let ruleLen = rules.length
      let argLen = args.length

      if (this.mode === 'strict') {
        // array length should equal in strict mode
        if (ruleLen !== argLen) {
          let error = new Error(`type requires array with ${ruleLen} items in strict mode, but receive ${argLen}`)
          error.arguments = [arg]
          error.pattern = pattern
          return error
        }
      }

      let patterns = [].concat(rules)

      // if arguments.length is bigger than rules.length, use Enum to match left items
      if (argLen > ruleLen) {
        let ItemType = ruleLen > 1 ? Enum(...rules) : ruleLen ? rules[0] : Any
        for (let i = ruleLen; i < argLen; i ++) {
          patterns.push(ItemType)
        }
      }

      for (let i = 0; i < argLen; i ++) {
        let pattern = patterns[i]
        let value = args[i]
      
        // if can be not exists
        if ((pattern instanceof Rule || pattern instanceof Type) && pattern.if_exists && typeof value === 'undefined') {
          return null
        }

        let error = this.vaildate(value, pattern)
        if (error) {
          return error
        }
      }
      
      return null
    }

    if (isObject(rule) && isObject(arg)) {
      let rules = rule
      let args = arg
      let ruleKeys = Object.keys(rules).sort()
      let argKeys = Object.keys(args).sort()
      
      if (this.mode === 'strict') {
        // properties should be absolutely same
        for (let i = 0, len = argKeys.length; i < len; i ++) {
          let argKey = argKeys[i]
          // args has key beyond rules
          if (ruleKeys.indexOf(argKey) === -1) {
            let error = new Error(`"${argKey}" should not be in object, only "${ruleKeys.join('","')}" allowed in strict mode`)
            error.arguments = [arg]
            error.pattern = pattern
            return error
          }
        }
      }

      for (let i = 0, len = ruleKeys.length; i < len; i ++) {
        let ruleKey = ruleKeys[i]
        let pattern = rules[ruleKey]
        let argKey = ruleKey
        let value = args[argKey]

        // can be not exists by using IfExists() in non-strict mode
        if (this.mode !== 'strict' && (pattern instanceof Rule || pattern instanceof Type) && pattern.if_exists && argKeys.indexOf(ruleKey) === -1) {
          continue
        }

        // not found some key in arg
        if (argKeys.indexOf(ruleKey) === -1) {
          let error = new Error(`"${ruleKey}" is not in object, needs ${ruleKeys.join(',')}`)
          error.arguments = [arg]
          error.pattern = pattern
          return error
        }

        let error = this.vaildate(value, pattern)
        if (error) {
          return error
        }
      }

      return null
    }

    // is the given value, rule should be a string, a number or a boolean
    // i.e. (new Type('name')).assert('name')
    if (!(rule instanceof Object) && arg === rule) {
      return null
    }

    // instance of a class
    // i.e. (new Type(Person)).assert(person)
    if (isConstructor(rule) && arg instanceof rule) {
      return null
    }

    // instance of Type
    // const BooksType = List(BookType)
    // BooksType.assert([{ name: 'Hamlet', price: 120.34 }])
    if (rule instanceof Type) {
      // can be not exists
      if (rule.if_exists && typeof arg === 'undefined') {
        return null
      }

      rule.assert(arg)
      return null
    }

    let error = new Error(typeof(arg) + ' does not match type of "' + pattern.toString() + '"')
    error.arguments = [arg]
    error.pattern = pattern
    return error
  }
  assert(...args) {
    if (args.length !== this.rules.length) {
      let error = new Error('arguments length not match type')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let rules = this.rules
    let patterns = this.patterns
    for (let i = 0, len = args.length; i < len; i ++) {
      let arg = args[i]
      let rule = rules[i]
      let pattern = patterns[i]
      let error = this.vaildate(arg, rule, pattern)
      if (error) {
        throw error
      }
    }
  }
  catch(...args) {
    try {
      this.assert(...args)
      return null
    }
    catch(error) {
      return error
    }
  }
  test(...args) {
    let error = this.catch(...args)
    return !error
  }

  /**
   * track args with type
   * @param {*} args 
   * @example
   * SomeType.trace(arg).with((error, [arg], type) => { ... })
   */
  trace(...args) {
    return {
      with: (fn) => new Promise((resolve) => {
        Promise.resolve().then(() => {
          let error = this.catch(...args)
          if (error && isFunction(fn)) {
            fn(error, args, this)
          }
          resolve(error)
        })
      }),
    }
  }
}