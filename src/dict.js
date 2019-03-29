import Type from './type'
import { isObject, inObject } from './utils'
import { _ERROR_, xError } from './error'


const prototypes = {
  assert: function(value) {
    if (!isObject(value)) {
      throw new _ERROR_('refuse', { value, type: this, action: 'assert' })
    }

    let rule = this.rules[0]
    let error = this.validate(value, rule)
    if (error) {
      throw xError(error, { value, rule, type: this, action: 'assert' })
    }
  },
  extend: function(pattern) {
    const originalPattern = this.patterns[0]
    const newPattern = Object.assign({}, originalPattern, pattern)
    const newType = Dict(newPattern)
    return newType
  },
  shrink: function(pattern) {
    const originalPattern = this.patterns[0]
    const originalKeys = Object.keys(originalPattern)
    const newPattern = {}
    originalKeys.forEach((key) => {
      if (pattern[key]) {
        newPattern[key] = originalPattern[key]
      }
    })
    const newType = Dict(newPattern)
    return newType
  },
}

export function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  const DictType = new Type(pattern)
  DictType.name = 'Dict'

  DictType.assert = prototypes.assert.bind(DictType)
  DictType.extend = prototypes.extend.bind(DictType)
  DictType.shrink = prototypes.shrink.bind(DictType)

  return DictType
}
export default Dict
