import Type from './type'
import { isArray, throwError } from './utils'
import Enum from './enum'

export default function List(pattern) {
  // if pattern is not an array, it treated undefined
  if (!isArray(pattern)) {
    return new Type(Array)
  }

  // if pattern is an empty object, it treated to be an Object
  if (isEmpty(pattern)) {
    return new Type(Array)
  }

  let ListType = new Type(...pattern)
  ListType.assert = function(args) {
    if (!isArray(args)) {
      return throwError(`"${typeof(args)}" is not match List type`)
    }

    let rules = this.rules
    let ruleLen = rules.length
    let argLen = args.length

    if (this.mode === 'strict') {
      // array length should equal in strict mode
      if (ruleLen !== argLen) {
        return throwError(`List requires array with ${ruleLen} items in strict mode, but receive ${argLen}`)
      }
    }

    let patterns = [].concat(rules)

    // if arguments.length is bigger than rules.length, use Enum to match left items
    if (argLen > ruleLen) {
      let EnumType = Enum(...rules)
      for (let i = ruleLen; i < argLen; i ++) {
        patterns.push(EnumType)
      }
    }

    for (let i = 0; i < argLen; i ++) {
      let rule = patterns[i]
      let value = args[i]

      let result = this.vaildate(value, rule)
      if (result !== true) {
        return result
      }
    }

    return true
  }
  return ListType
}