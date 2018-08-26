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
      let error = new TypeError('arguments length not match ' + this.name)
      throw xError(error, { args, type: this.name })
    }

    let arg = args[0]
    if (!isNumber(arg)) {
      let error = new TypeError('%arg is not a number for ' + this.name)
      throw xError(error, { arg, type: this.name })
    }

    let [min, max] = this.patterns
    if (arg >= min && arg <= max) {
      return
    }
    
    let error = new TypeError(`%arg does not match ${this.name}(${min}, ${max})`)
    throw xError(error, { arg, rule: [min, max], type: this.name })
  }
  return RangeType
}