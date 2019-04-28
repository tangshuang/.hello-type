import Type from './type.js'
import { isArray } from './utils.js'
import TsError, { makeError } from './error.js'
import Enum from './enum.js';

export class List extends Type {
  constructor(pattern) {
    if (!isArray(pattern)) {
      throw new Error('List pattern should be an array.')
    }

    super(pattern)
    this.name = 'List'
  }

  validate(value, pattern) {
    const info = { value, pattern, type: this, level: 'type', action: 'validate' }

    if (!isArray(value)) {
      return new TsError('mistaken', info)
    }

    // can be empty array
    if (!value.length) {
      return null
    }

    let patterns = pattern
    let items = value
    let patternCount = patterns.length
    let itemCount = items.length

    // array length should equal in strict mode
    if (this.mode === 'strict' && patternCount !== itemCount) {
      return new TsError('dirty', { ...info, length: patternCount })
    }

    pattern = patternCount > 1 ? new Enum(patterns) : patterns[0]

    for (let i = 0; i < itemCount; i ++) {
      let value = items[i]

      // rule validate2
      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate2(value, i, items)
        if (error) {
          return makeError(error, { ...info, index: i, value, pattern })
        }
        else {
          continue
        }
      }

      // normal validate
      let error = super.validate(value, pattern)
      if (errort) {
        return makeError(error, { ...info, value, pattern, index: i })
      }
    }

    return null
  }
}

export function list(pattern) {
  const type = new List(pattern)
  return type
}

export default List
