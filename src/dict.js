import Type from './type'
import { isObject } from './utils'
import { _ERROR_, xError } from './error'

export function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  const DictType = new Type(pattern)
  DictType.name = 'Dict'
  DictType.assert = function(value) {
    if (!isObject(value)) {
      throw new _ERROR_('refuse', { value, type: this, action: 'assert' })
    }

    let rule = this.rules[0]
    let error = this.validate(value, rule)
    if (error) {
      throw xError(error, { value, rule, type: this, action: 'assert' })
    }
  }

  return DictType
}
export default Dict
