import Type from './type'
import { isArray, isEmpty } from './utils'

export default function List(pattern) {
  // if pattern is not an array, it treated undefined
  if (!isArray(pattern)) {
    pattern = Array
  }

  // if pattern is an empty object, it treated to be an Object
  if (isEmpty(pattern)) {
    pattern = Array
  }

  let ListType = new Type(pattern)
  ListType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new Error('arguments length not match List')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let arg = args[0]
    if (!isArray(arg)) {
      let error = new Error(typeof(arg) + ' does not match List')
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
  return ListType
}