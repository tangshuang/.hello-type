import Type from './type'
import { isNumber, xError, stringify } from './utils'
import { criticize } from './messages'

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
      let message = criticize('range.arguments.length', {
        args: stringify(args),
        name: this.toString(),
        length: 1,
      })
      let error = new TypeError(message)
      throw xError(error, { args, type: this.name })
    }

    let arg = args[0]
    if (!isNumber(arg)) {
      let message = criticize('range.number', {
        arg: stringify(arg),
        name: this.toString(),
      })
      let error = new TypeError(message)
      throw xError(error, { arg, type: this.name })
    }

    let [min, max] = this.patterns
    if (arg >= min && arg <= max) {
      return
    }
    
    let message = criticize('range', {
      arg: stringify(arg),
      name: this.toString(),
      min,
      max,
    })
    let error = new TypeError(message)
    throw xError(error, { arg, rule: [min, max], type: this.name })
  }
  return RangeType
}