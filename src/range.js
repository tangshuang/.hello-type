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
    min = 0
    max = 1
  }

  let RangeType = new Type(min, max)
  RangeType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new Error('arguments length not match Range')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let arg = args[0]
    if (!isNumber(arg)) {
      let error = new Error(typeof(arg) + ' is not a number for Range')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let [min, max] = this.patterns
    if (arg >= min && arg <= max) {
      return
    }
    
    let error = new Error(typeof(arg) + ` does not match Range(${min}, ${max})`)
    error.arguments = args
    error.pattern = pattern
    throw error
  }
  return RangeType
}