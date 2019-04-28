import Type from './type.js'
import { isInstanceOf } from './utils.js'
import TsError, { makeError } from './error.js'

export class Enum extends Type {
  constructor(pattern) {
    if (!isArray(pattern)) {
      throw new Error('Enum pattern should be an array.')
    }

    super(pattern)
    this.name = 'Enum'
  }

  validate(value, pattern) {
    const info = { value, pattern, type: this, level: 'type', action: 'validate' }
    const patterns = pattern

    for (let i = 0, len = pattern.length; i < len; i ++) {
      let pattern = patterns[i]
      let error = super.validate(value, pattern)
      // if there is one match, break the loop
      if (!error) {
        return null
      }
    }

    return new TsError('mistaken', info)
  }
}

export function enumerate(...patterns) {
  const type = new Enum(...patterns)
  return type
}

export default Enum
