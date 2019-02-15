import Type from './type'
import { isNumber } from './utils'
import { _ERROR_ } from './error'

export function Range(min, max) {
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
  RangeType.assert = function(value) {
    if (!isNumber(value)) {
      throw new _ERROR_('refuse', { value, type: this, action: 'assert' })
    }

    let [min, max] = this.patterns
    if (value >= min && value <= max) {
      return
    }

    throw new _ERROR_('refuse', { value, type: this, action: 'assert', min, max })
  }
  return RangeType
}
export default Range
