import { isArray, isBoolean, isNumber, isObject, toFlatObject, isEmpty, inArray } from './utils'

export default class Type {
  constructor(...patterns) {
    this.id = Date.now()  + '.' + parseInt(Math.random() * 10000)
    this.strictMode = false
    
    if (!patterns.length) {
      return
    }

    this.patterns = patterns.map((pattern) => {
      if (isObject(pattern)) {
        let flatObj = toFlatObject(pattern)
        return isEmpty(flatObj) ? Object : flatObj
      }
      else if (isArray(pattern)) {
        return Array
      }
      else {
        return pattern
      }
    })
  }
  vaildate(arg, pattern) {
    // is the given value
    // i.e. (new Type('name')).assert('name')
    if (arg === pattern) {
      return true
    }

    // NaN
    // i.e. (new Type(NaN)).assert(NaN)
    if (isNaN(arg) && isNaN(pattern)) {
      return true
    }

    // number
    // i.e. (new Type(Number).assert(1))
    if (isNumber(arg) && pattern === Number) {
      return true
    }

    // boolean
    // i.e. (new Type(Boolean)).assert(true)
    if (isBoolean(arg) && pattern === Boolean) {
      return true
    }

    // object
    // i.e. (new Type(Object).assert({}))
    if (isObject(arg) && pattern === Object) {
      return true
    }

    // instance
    // i.e. (new Type(Function)).assert(() => {})
    // i.e. (new Type(Array)).assert([])
    if (arg instanceof pattern) {
      return true
    }

    // @example:
    // const BookType = new Type({
    //   name: String,
    //   price: Number,
    // })
    // BookType.assert({ name: 'Hamlet', price: 120.34 })
    if (isObject(arg) && isObject(pattern)) {
      let flatArg = toFlatObject(arg)
      let patternPaths = Object.keys(pattern)
      let argPaths = Object.keys(flatArg)

      if (this.strictMode) {
        argPaths.forEach((argPath) => {
          if (!inArray(argPath, patternPaths)) {
            // here, arg may be a deep level object, which contained by Type, so I have to check reverse
            let exists = patternPaths.find((item) => {
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

            throw new Error(`key "${patternPath}" in your argument is not allowed in strict mode`)
          }
        })
      }
      
      patternPaths.forEach((patternPath) => {
        if (!inArray(patternPath, argPaths)) {
          throw new Error(`can't find key "${patternPath}" in your argument`)
        }

        let type = patternPath[patternPath]
        let value = flatArg[argPath]
        this.vaildate(value, type)
      })

      return true
    }

    // @example:
    // const BooksType = List(BookType)
    // BooksType.assert([{ name: 'Hamlet', price: 120.34 }])
    if (pattern instanceof Type) {
      return pattern.assert(arg)
    }

    let typeName = pattern
    let argName = arg
    if (typeof pattern === 'function') {
      typeName = pattern.name
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
    throw new Error(argName + ' not match type of "' + typeName + '"')
  }
  assert(...args) {
    if (args.length !== this.patterns.length) {
      throw new Error('arguments length not match type')
    }

    args.forEach((arg, i) => {
      let pattern = this.patterns[i]
      this.vaildate(arg, pattern)
    })
  }
  meet(...args) {
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

  strict(mode) {
    this.strictMode = mode
    return this
  }
}