import Type from './type.js'
import Rule from './rule.js'
import { isInstanceOf } from './utils.js'
import TsError, { makeError } from './error.js'

export class Tuple extends Type {
  constructor(pattern) {
    if (!isArray(pattern)) {
      throw new Error('Tuple pattern should be an array.')
    }

    super(pattern)
    this.name = 'Tuple'
  }
  validate(value, pattern) {
    const info = { value, pattern, type: this, level: 'type', action: 'validate' }

    if (!isArray(value)) {
      return new TsError('mistaken', info)
    }

    const items = value
    const patterns = pattern
    const patternCount = patterns.length
    const itemCount = items.length

    if (this.mode === 'strict' && itemCount !== patternCount) {
      return new TsError('dirty', { ...info, length: patternCount })
    }

    for (let i = 0; i < itemCount; i ++) {
      let value = items[i]
      let pattern = patterns[i]

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
      if (error) {
        return makeError(error, { ...info, value, pattern, index: i })
      }
    }

    return null
  }
}

export function tuple(...patterns) {
  const type = new Tuple(...patterns)
  return type
}

export default Tuple
