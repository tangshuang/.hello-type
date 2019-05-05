import Type from './type.js'
import { isArray, isEmpty } from './utils.js'
import TsError, { makeError } from './error.js'
import { Any } from './rules.js'

export class List extends Type {
  constructor(pattern) {
    if (!isArray(pattern)) {
      throw new TsError('List pattern should be an array.')
    }

    if (isEmpty(pattern)) {
      pattern = Array
    }

    super(pattern)
    this.name = 'List'
  }
  assert(value) {
    const pattern = this.pattern
    const info = { value, pattern, type: this, level: 'type', action: 'assert' }

    if (!isArray(value)) {
      throw new TsError('mistaken', info)
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
