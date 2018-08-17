import { isArray, isBoolean, isNumber, isObject, toShallowObject, isFunction, isConstructor } from './utils'
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
  vaildate(arg, rule) {
    // custom rule
    // i.e. (new Type(new Rule(value => typeof value === 'object'))).assert(null)
    if (rule instanceof Rule) {
      // if can be not exists
      if (rule.if_exists && typeof arg === 'undefined') {
        return null
      }

      if (!isFunction(rule.factory)) {
        return new Error('new Rule should receive a function')
      }
      else {
        let error = rule.factory(arg)
        if (error instanceof Error) {
          return error
        }
      }

      return null
    }

    // is the given value
    // i.e. (new Type('name')).assert('name')
    if (arg === rule) {
      return null
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (typeof arg === 'number' && isNaN(arg) && typeof rule === 'number' && isNaN(rule)) {
      return null
    }

    // number
    // i.e. (new Type(Number).assert(1))
    if (isNumber(arg) && rule === Number) {
      return null
    }

    // boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (isBoolean(arg) && rule === Boolean) {
      return null
    }

    // string
    if (typeof arg === 'string' && rule === String) {
      return null
    }

    // array
    // i.e. (new Type(Array)).assert([])
    if (isArray(arg) && rule === Array) {
      return null
    }

    if (isArray(arg) && isArray(rule)) {
      let rules = rule
      let args = arg
      let ruleLen = rules.length
      let argLen = args.length

      if (this.mode === 'strict') {
        // array length should equal in strict mode
        if (ruleLen !== argLen) {
          return new Error(`type requires array with ${ruleLen} items in strict mode, but receive ${argLen}`)
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
    
    // object
    // i.e. (new Type(Object).assert({}))
    if (isObject(arg) && rule === Object) {
      return null
    }

    if (isObject(arg) && isObject(rule)) {
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
            return new Error(`"${argKey}" should not be in object, only ${ruleKeys.join(',')} allowed in strict mode`)
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
          return new Error(`"${ruleKey}" is not in object, needs ${ruleKeys.join(',')}`)
        }

        let error = this.vaildate(value, pattern)
        if (error) {
          return error
        }
      }

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

    let typeName = rule
    let argName = arg
    if (isFunction(rule)) {
      typeName = rule.name
    }
    if (isFunction(arg)) {
      argName = 'function ' + arg.name
    }
    else if (arg === null) {
      argName = 'null'
    }
    else if (typeof arg === 'object') {
      argName = 'argument is an instance of ' + arg.constructor ? arg.constructor.name : 'some type'
    }
    return new Error(argName + ' not match type of "' + typeName + '"')
  }
  assert(...args) {
    if (args.length !== this.rules.length) {
      throw new Error('arguments length not match type')
    }

    let rules = this.rules
    for (let i = 0, len = args.length; i < len; i ++) {
      let arg = args[i]
      let pattern = rules[i]
      let error = this.vaildate(arg, pattern)
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