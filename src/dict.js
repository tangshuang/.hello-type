import Type from './type'
import { isObject, isEmpty } from './utils'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  // if pattern is an empty object, it treated to be an Object
  if (isEmpty(pattern)) {
    pattern = Object
  }

  let DictType = new Type(pattern)
  DictType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new Error('arguments length not match Dict')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let arg = args[0]
    if (!isObject(arg)) {
      let error = new Error(typeof(arg) + ' does not match Dict')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let rule = this.rules[0]
    let error = this.vaildate(arg, rule)
    if (error) {
      throw error
    }
  }
  return DictType
}