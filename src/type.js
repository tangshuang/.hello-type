import { isArray, isBoolean, isNumber, isObject, toShallowObject, isFunction, isConstructor } from './utils'
import Rule from './rule'
import Dict from './dict'
import List from './list'

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
        return List(rule)
      }
      else {
        return rule
      }
    })
  }
  get strict() {
    this.mode = 'strict'
    return this
  }
  vaildate(arg, rule) {
    // custom rule
    // i.e. (new Type(new Rule(value => typeof value === 'object'))).assert(null)
    if (rule instanceof Rule) {
      let e = isFunction(rule.factory) && rule.factory(arg)
      if (e !== true) {
        if(e instanceof Error) {
          throw e
        }
        else {
          throw new Error(result || 'argument not match custom rule')
        }
      }
      return true
    }

    // is the given value
    // i.e. (new Type('name')).assert('name')
    if (arg === rule) {
      return true
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (typeof arg === 'number' && isNaN(arg) && typeof rule === 'number' && isNaN(rule)) {
      return true
    }

    // number
    // i.e. (new Type(Number).assert(1))
    if (isNumber(arg) && rule === Number) {
      return true
    }

    // boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (isBoolean(arg) && rule === Boolean) {
      return true
    }

    // string
    if (typeof arg === 'string' && rule === String) {
      return true
    }

    // array
    // i.e. (new Type(Array)).assert([])
    if (isArray(arg) && rule === Array) {
      return true
    }
    
    // object
    // i.e. (new Type(Object).assert({}))
    if (isObject(arg) && rule === Object) {
      return true
    }

    // instance of a class
    // i.e. (new Type(Person)).assert(person)
    if (isConstructor(rule) && arg instanceof rule) {
      return true
    }

    // instance of Type
    // const BooksType = List(BookType)
    // BooksType.assert([{ name: 'Hamlet', price: 120.34 }])
    if (rule instanceof Type) {
      return rule.assert(arg)
    }

    let typeName = rule
    let argName = arg
    if (isFunction(rule)) {
      typeName = rule.name
    }
    if (isFunction(arg)) {
      argName = 'function ' + arg.name
    }
    else if (typeof arg === 'object') {
      argName = 'argument is an instance of ' + arg.constructor ? arg.constructor.name : 'some type'
    }
    throw new Error(argName + ' not match type of "' + typeName + '"')
  }
  assert(...args) {
    if (args.length !== this.rules.length) {
      throw new Error('arguments length not match type')
    }

    for (let i = 0, len = args.length; i < len; i ++) {
      let arg = args[i]
      let rule = this.rules[i]
      this.vaildate(arg, rule)
    }

    return true
  }
  catch(...args) {
    try {
      this.assert(...args)
    }
    catch(e) {
      return e
    }
  }
  test(...args) {
    try {
      this.assert(...args)
      return true
    }
    catch(e) {
      return false
    }
  }
  trace(...args) {
    return Promise.resolve().then(() => {
      this.assert(...args)
    })
  }
}