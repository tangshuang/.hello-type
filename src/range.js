import Type from './type.js'
import { isNumber } from './utils.js'
import { TxpeError } from './error.js'

export class Range extends Type {
  constructor(min, max) {
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
    super(min, max)
    this.name = 'Range'
  }
  assert(value) {
    if (!isNumber(value)) {
      throw new TxpeError('shouldmatch', { value, type: this, level: 'assert' })
    }

    let [min, max] = this.patterns
    if (value >= min && value <= max) {
      return
    }

    throw new TxpeError('shouldmatch', { value, type: this, level: 'assert', min, max })
  }
}

export function range(min, max) {
  const type = new Range(min, max)
  return type
}

export default Range
