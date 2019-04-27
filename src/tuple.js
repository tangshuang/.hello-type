import Type from './type.js'
import Rule from './rule.js'
import { isInstanceOf } from './utils.js'
import { makeError, RtsmError } from './error.js'

export class Tuple extends Type {
  constructor(pattern) {
    if (!isArray(pattern)) {
      throw new Error('Tuple pattern should be an array.')
    }

    super(pattern)
    this.name = 'Tuple'
  }
  validate(value, pattern) {
    if (!isArray(value)) {
      return new RtsmError('mistaken', { value, pattern, type: this, level: 'validate' })
    }

    const items = value
    const patterns = pattern
    const ruleCount = patterns.length
    const itemCount = items.length
    const info = { value, pattern, type: this, level: 'validate' }

    if (itemCount !== ruleCount) {
      return new RtsmError('dirty', { ...info, length: ruleCount })
    }

    for (let i = 0; i < itemCount; i ++) {
      let item = items[i]
      let pattern = patterns[i]
      let error = super.validate(item, pattern)
      if (error) {
        return makeError(error, info)
      }
    }

    return null
  }
  assert(value) {
    const pattern = this.pattern
    const info = { value, pattern, type: this, level: 'assert' }

    if (!isArray(value)) {
      throw new RtsmError('mistaken', info)
    }

    const error = this.validate(value, pattern)
    if (error) {
      throw makeError(error, info)
    }
  }
}

export function tuple(...patterns) {
  const type = new Tuple(...patterns)
  return type
}

export default Tuple
