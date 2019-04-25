import Type from './type.js'
import { isArray } from './utils.js'
import { xError, TxpeError } from './error.js'

export class List extends Type {
  constructor(pattern) {
    // if pattern is not an array, it treated undefined
    if (!isArray(pattern)) {
      pattern = Array
    }
    super(pattern)
    this.name = 'List'
  }
  assert(value) {
    if (!isArray(value)) {
      throw new TxpeError('shouldmatch', { value, type: this, level: 'assert' })
    }

    let rule = this.rules[0]
    let error = this.validate(value, rule)
    if (error) {
      throw xError(error, { value, rule, type: this, level: 'assert' })
    }
  }
}

export function list(pattern) {
  const type = new List(pattern)
  return type
}

export default List
