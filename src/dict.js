import Type from './type'
import { isObject } from './utils'
import { HelloTypeError, xError } from './error'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  const DictType = new Type(pattern)
  DictType.name = 'Dict'
  DictType.assert = function(target) {
    if (!isObject(target)) {
      throw new HelloTypeError('dict.object', { target, type: this })
    }

    let rule = this.rules[0]
    let error = this.vaildate(target, rule)
    if (error) {
      throw xError(error, { target, rule, type: this })
    }
  }

  return DictType
}
