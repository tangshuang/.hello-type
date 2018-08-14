import Type from './type'
import { isNumber } from './utils'

export default function Range(min, max) {
  if (!isNumber(min)) {
    min = 0
  }
  if (!isNumber(max)) {
    max = 1
  }
  if (min > max) {
    min = max
  }

  let RangeType = new Type(min, max)
  RangeType.assert = function(arg) {
    if (!isNumber(arg)) {
      throw new Error(`${arg} is not a number for Range`)
    }

    let [min, max] = this.patterns
    if (arg >= min && arg <= max) {
      return true
    }
    
    throw new Error(`"${arg}" is not match Range(${min}, ${max})`)
  }
  return RangeType
}