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
  RangeType.assert = function(...targets) {
    if (targets.length !== 1) {
      throw new HelloTypeError('range.arguments.length', { target: targets, type: this.name, targetLength: targets.length, ruleLength: 1 })
    }

    let target = targets[0]
    if (!isNumber(target)) {
      throw new HelloTypeError('range.number', { target, type: this.name })
    }

    let [min, max] = this.patterns
    if (target >= min && target <= max) {
      return
    }
    
    throw new HelloTypeError('range', { target, type: this.name, rule: [min, max], min, max })
  }
  return RangeType
}