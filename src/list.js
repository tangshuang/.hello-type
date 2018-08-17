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
      throw new Error('arguments length not match List')
    }

    let arg = args[0]
    if (!isArray(arg)) {
      throw new Error(`"${typeof(arg)}" not match List`)
    }

    let rule = this.rules[0]
    let error = this.vaildate(arg, rule)
    if (error) {
      throw error
    }
  }
  return ListType
}