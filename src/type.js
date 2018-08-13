import { isArray, isBoolean, isNumber, isObject, toFlatObject, isEmpty, inArray, isConstructor, throwError } from './utils'
import Rule from './rule'
import Enum from './enum'

export default class Type {
  constructor(...patterns) {
    this.id = Date.now()  + '.' + parseInt(Math.random() * 10000)
    this.mode = 'none'
    
    if (!patterns.length) {
      return
    }

    this.patterns = patterns
    this.rules = patterns.map((rule) => {
      if (isObject(rule)) {
        let flatObj = toFlatObject(rule)
        return isEmpty(flatObj) ? Object : flatObj
      }
      else if (isArray(rule)) {
        return isEmpty(rule) ? Array : rule
      }
      else {
        return rule
      }
    })
  }
  vaildate(arg, rule) {
    // custom rule
    // i.e. (new Type((value) => value === true)).assert(true)
    // notice, this rule should must be bebind `instance` rule
    if (rule instanceof Rule) {
      let result = typeof rule.factory && rule.factory(arg)
      if (result === true) {
        return true
      }
      else {
        return throwError('argument not match custom rule')
      }
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

    // @example:
    // const BookType = new Type([Number, Number])
    // BookType.strict.assert([1, 10])
    if (isArray(arg) && isArray(rule)) {
      let argLen = arg.length
      let ruleLen = rule.length

      if (this.mode === 'strict' && argLen !== ruleLen) {
        return throwError('array length should be ' + ruleLen + ', but receive ' + argLen)
      }

      let patterns = rule
      if (argLen > ruleLen) {
        for (let i = ruleLen; i < argLen; i ++) {
          let SpreadRule = rule.length > 1 ? Enum(...rule) : rule[0]
          patterns = patterns.contact([SpreadRule])
        }
      }
      arg.forEach((value, i) => {
        let pattern = patterns[i]
        this.vaildate(value, pattern)
      })
      return true
    }
    
    // object
    // i.e. (new Type(Object).assert({}))
    if (isObject(arg) && rule === Object) {
      return true
    }

    // @example:
    // const BookType = new Type({
    //   name: String,
    //   price: Number,
    // })
    // BookType.assert({ name: 'Hamlet', price: 120.34 })
    if (isObject(arg) && isObject(rule)) {
      let flatArg = toFlatObject(arg)
      let rulePaths = Object.keys(rule)
      let argPaths = Object.keys(flatArg)

      if (this.mode === 'strict') {
        for (let argPath of argPaths) {
          if (!inArray(argPath, rulePaths)) {
            // here, arg may be a deep level object, which contained by Type, so I have to check reverse
            let exists = rulePaths.find((item) => {
              if (argPath === item) {
                return true
              }
              if (argPath.indexOf(item + '.') === 0) {
                return true
              }
              return false
            })
            if (exists) {
              return
            }

            return throwError(`key "${rulePath}" in your argument is not allowed in strict mode`)
          }
        }
      }
      
      for (let rulePath of rulePaths) {
        if (!inArray(rulePath, argPaths)) {
          return throwError(`can't find key "${rulePath}" in your argument`)
        }

        let type = rule[rulePath]
        let value = flatArg[rulePath]
        this.vaildate(value, type)
      }

      return true
    }

    // instance
    // i.e. (new Type(Function)).assert(() => {})
    // i.e. (new Type(Array)).assert([])
    if (isConstructor(rule) && arg instanceof rule) {
      return true
    }

    // @example:
    // const BooksType = List(BookType)
    // BooksType.assert([{ name: 'Hamlet', price: 120.34 }])
    if (rule instanceof Type) {
      return rule.assert(arg)
    }

    let typeName = rule
    let argName = arg
    if (typeof rule === 'function') {
      typeName = rule.name
    }
    if (typeof arg === 'function') {
      argName = 'function ' + arg.name
    }
    else if (isObject(arg)) {
      argName = 'argument is an object'
    }
    else if (isArray(arg)) {
      argName = 'argument is an array'
    }
    else if (typeof arg === 'object') {
      argName = 'argument is an instance of ' + arg.constructor ? arg.constructor.name : 'some type'
    }
    return throwError('"' + argName + '" not match type of "' + typeName + '"')
  }
  assert(...args) {
    if (args.length !== this.rules.length) {
      return throwError('arguments length not match type')
    }

    args.forEach((arg, i) => {
      let rule = this.rules[i]
      this.vaildate(arg, rule)
    })
  }
  catch(...args) {
    try {
      this.assert(...args)
      return null
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

  get strict() {
    let newInstance = new Type(...this.patterns)
    newInstance.mode = 'strict'
    return newInstance
  }
}