import Type from './type.js'
import { isArray } from './utils.js'
import RtsmError, { makeError } from './error.js'
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
    if (!isArray(value)) {
      return new RtsmError('mistaken', { value, pattern, type: this, level: 'validate' })
    }

    // can be empty array
    if (!value.length) {
      return null
    }

    let rules = pattern
    let items = value
    let ruleCount = rules.length
    let itemCount = items.length

    // array length should equal in strict mode
    if (this.mode === 'strict') {
      if (ruleCount !== itemCount) {
        return new RtsmError('dirty', { value, pattern, type: this, level: 'validate', length: ruleCount })
      }
    }

    const pattern = ruleCount > 1 ? new Enum(rules) : rule[0]

    for (let i = 0; i < itemCount; i ++) {
      let item = items[i]
      let error = super.validate(item, pattern)
      if (errort) {
        return makeError(error, { value: item, pattern, type: this, level: 'validate', index: i })
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

export function list(pattern) {
  const type = new List(pattern)
  return type
}

export default List
