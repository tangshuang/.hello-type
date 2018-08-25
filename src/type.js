import { isArray, inArray, isBoolean, isNumber, isObject, toShallowObject, isString, isFunction, isSymbol, isConstructor, xError, clone } from './utils'
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
  /**
   * vaildate whether the argument match the rule
   * @param {*} arg
   * @param {*} rule 
   */
  vaildate(arg, rule) {
    // custom rule
    // i.e. (new Type(new Rule(value => typeof value === 'object'))).assert(null)
    if (rule instanceof Rule) {
      let error = rule.vaildate(arg)
      return xError(error, { arg, rule })
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (typeof rule === 'number' && isNaN(rule)) {
      if (typeof arg === 'number' && isNaN(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match NaN')
        return xError(error, { arg, rule })
      }
    }

    // Number
    // i.e. (new Type(Number).assert(1))
    if (rule === Number) {
      if (isNumber(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match Number')
        return xError(error, { arg, rule })
      }
    }

    // Boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (rule === Boolean) {
      if (isBoolean(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match Boolean')
        return xError(error, { arg, rule })
      }
    }

    // String
    // i.e. (new Type(String)).assert('name')
    if (rule === String) {
      if (isString(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match String')
        return xError(error, { arg, rule })
      }
    }

    // Function
    // i.e. (new Type(Function)).assert(() => {})
    if (rule === Function) {
      if (isFunction(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match Function')
        return xError(error, { arg, rule })
      }
    }

    // Array
    // i.e. (new Type(Array)).assert([])
    if (rule === Array) {
      if (isArray(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match Array')
        return xError(error, { arg, rule })
      }
    }

    // object
    // i.e. (new Type(Object).assert({}))
    if (rule === Object) {
      if (isObject(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match Object')
        return xError(error, { arg, rule })
      }
    }

    if (rule === Symbol) {
      if (isSymbol(arg)) {
        return null
      }
      else {
        let error = new TypeError('%arg does not match Symbol')
        return xError(error, { arg, rule })
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
          let error = new TypeError(`array's length should be ${ruleLen} in strict mode, but receive ${argLen}`)
          return xError(error, { arg, rule })
        }
      }
      
      // if arguments.length is bigger than rules.length, use Enum to match left items
      let clonedRules = [].concat(rules)
      if (argLen > ruleLen) {
        let ItemType = ruleLen > 1 ? Enum(...rules) : ruleLen ? rules[0] : Any
        for (let i = ruleLen; i < argLen; i ++) {
          clonedRules.push(ItemType)
        }
      }

      for (let i = 0; i < argLen; i ++) {
        let arg = args[i]
        let rule = clonedRules[i]

        if (rule instanceof Rule) {
          let error = rule.vaildate(arg)
          
          // use rule to override property when not match
          // override value and check again
          if (isFunction(rule.override)) {
            arg = rule.override(error, args, i) || args[i]
            error = rule.vaildate(arg)
          }

          if (error) {
            return xError(error, { arg, rule, key: argKey })
          }
          else {
            continue
          }
        }
        
        // normal vaildate
        let error = this.vaildate(arg, rule)
        if (error) {
          return xError(error, { arg, rule, index: i })
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
          if (!inArray(argKey, ruleKeys)) {
            let error = new TypeError(`"${argKey}" should not be in object, only "${ruleKeys.join('","')}" allowed in strict mode`)
            return xError(error, { arg, rule, key: argKey })
          }
        }
      }

      for (let i = 0, len = ruleKeys.length; i < len; i ++) {
        let ruleKey = ruleKeys[i]
        let rule = rules[ruleKey]
        let argKey = ruleKey
        let arg = args[argKey]

        // not found some key in arg
        // i.e. should be { name: String, age: Number } but give { name: 'tomy' }, 'age' is missing
        if (!inArray(ruleKey, argKeys)) {
          // IfExists:
          if (rule instanceof Rule && this.mode !== 'strict') {
            let error = rule.vaildate(arg)
            if (!error) {
              continue
            }
          }

          let error = new TypeError(`"${ruleKey}" is not in object, needs ${ruleKeys.join(',')}`)
          return xError(error, { arg, rule, key: ruleKey })
        }

        if (rule instanceof Rule) {
          let error = rule.vaildate(arg)
          
          // use rule to override property when not match
          // override value and check again
          if (isFunction(rule.override)) {
            arg = rule.override(error, args, argKey) || args[argKey]
            error = rule.vaildate(arg)
          }

          if (error) {
            return xError(error, { arg, rule, key: argKey })
          }
          else {
            continue
          }
        }
        
        // normal vaildate
        let error = this.vaildate(arg, rule)
        if (error) {
          return xError(error, { arg, rule, key: argKey })
        }
      }

      return null
    }

    // is the given value, rule should not be an object/instance
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
      let error = rule.catch(arg)
      if (error) {
        return xError(error, { arg, rule })
      }

      return null
    }

    let error = new TypeError('%arg does not match type of %rule')
    return xError(error, { arg, rule })
  }
  assert(...args) {
    if (args.length !== this.rules.length) {
      let error = new TypeError('arguments length not match type')
      throw xError(error, { args, rules })
    }

    let rules = this.rules
    for (let i = 0, len = args.length; i < len; i ++) {
      let arg = args[i]
      let rule = rules[i]
      let error = this.vaildate(arg, rule)
      if (error) {
        throw xError(error, { arg, rule, index: i, args, rules })
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
   * track args with type sync
   * @param {*} args 
   */
  track(...args) {
    return {
      with: (fn) => new Promise((resolve) => {
        let error = this.catch(...args)
        if (error && isFunction(fn)) {
          let params = clone(args)
          Promise.resolve().then(() => fn(error, params, this))
        }
        resolve(error)
      }),
    }
  }

  /**
   * track args with type async
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

  toBeStrict(mode = true) {
    this.mode = mode ? 'strict' : 'none'
    return this
  }
  get strict() {
    let ins = new Type(...this.patterns)
    return ins.toBeStrict()
  }
  get Strict() {
    return this.strict
  }
}