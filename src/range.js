import Type from './type'
import { isNumber } from './utils'
import { HelloTypeError } from './error'

export default function Range(min, max) {
  if (!isNumber(min)) {
    min = 0
  }
  if (!isNumber(max)) {
    max = 1
  }
  if (min > max) {
    min = 0
    max = 1
  }

  const RangeType = new Type(min, max)
  RangeType.name = 'Range'
  RangeType.assert = function(target) {
    if (!isNumber(target)) {
      throw new HelloTypeError('range.number', { target, type: this })
    }

    let [min, max] = this.patterns
    if (target >= min && target <= max) {
      return
    }

    throw new HelloTypeError('range', { target, type: this, rule: [min, max], min, max })
  }
  return RangeType
}
