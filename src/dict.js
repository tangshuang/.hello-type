import Type from './type'
import { isObject, isEmpty } from './utils'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    return new Type(Object)
  }

  // if pattern is an empty object, it treated to be an Object
  if (isEmpty(pattern)) {
    return new Type(Object)
  }

  let DictType = new Type(pattern)
  DictType.assert = function(arg) {
    if (!isObject(arg)) {
      throw new Error(`"${typeof(arg)}" is not match Dict type`)
    }

    this.vaildate(arg, this.rules[0])
  }
  return DictType
}