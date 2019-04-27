import Type from './type.js'
import { isInstanceOf } from './utils.js'
import RtsmError, { makeError } from './error.js'

export class Enum extends Type {
  constructor(pattern) {
    if (!isArray(pattern)) {
      throw new Error('Enum pattern should be an array.')
    }

    super(pattern)
    this.name = 'Enum'
  }

  validate(value, pattern) {
    const patterns = pattern
    for (let i = 0, len = pattern.length; i < len; i ++) {
      let pattern = patterns[i]
      let match
      if (isInstanceOf(pattern, Type)) {
        match = pattern.test(value)
      }
      else {
        match = super.validate(value, pattern)
      }

      // if there is one match, break the loop
      if (match) {
        return null
      }
    }

    return new RtsmError('mistaken', { value, pattern, type: this, level: 'validate' })
  }

  assert(value) {
    let pattern = this.pattern
    let error = this.validate(value, pattern)
    if (error) {
      throw makeError(error, { value, pattern, type: this, level: 'assert' })
    }
  }
}

export function enumerate(...patterns) {
  const type = new Enum(...patterns)
  return type
}

export default Enum
