import Type from './type'
import { isArray } from './utils'
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

  let ListType = new Type(pattern)
  ListType.assert = function(arg) {
    if (!isArray(arg)) {
      throw new Error(`"${typeof(arg)}" is not match List type`)
    }

    this.vaildate(arg, this.rules[0])
  }
  return ListType
}