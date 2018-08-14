import Type from './type'
import { isObject, throwError } from './utils'

export default function Dict(pattern) {
  if (!isObject(pattern)) {
    pattern = Object
  }
  let DictType = new Type(pattern)
  DictType.assert = function(arg) {
    if (!isObject(arg)) {
      return throwError(`"${typeof(arg)}" is not match Dict type`)
    }
    let pattern = this.patterns[0]
    return this.vaildate(arg, pattern)
  }
  return DictType
}