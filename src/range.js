import Type from './type'
import { isNumber, xError } from './utils'

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
  RangeType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new TypeError('arguments length not match Range')
      throw xError(error, { args, type: 'Range' })
    }

    let arg = args[0]
    if (!isNumber(arg)) {
      let error = new TypeError('%arg is not a number for Range')
      throw xError(error, { arg, type: 'Range' })
    }

    let [min, max] = this.patterns
    if (arg >= min && arg <= max) {
      return
    }
    
    let error = new TypeError(`%arg does not match Range(${min}, ${max})`)
    throw xError(error, { arg, rule: [min, max], type: 'Range' })
  }
  return RangeType
}