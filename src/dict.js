import Type from './type'
import { isObject, xError } from './utils'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  const DictType = new Type(pattern)
  DictType.name = 'Dict'
  DictType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new TypeError('arguments length not match Dict')
      throw xError(error, { args, type: 'Dict' })
    }

    let arg = args[0]
    if (!isObject(arg)) {
      let error = new TypeError('%arg does not match Dict')
      throw xError(error, { arg, type: 'Dict' })
    }

    let rule = this.rules[0]
    let error = this.vaildate(arg, rule)
    if (error) {
      throw xError(error, { arg, rule, type: 'Dict' })
    }
  }
  return DictType
}