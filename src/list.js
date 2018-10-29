import Type from './type'
import { isArray } from './utils'
import { xError, HelloTypeError } from './error'

export default function List(pattern) {
  // if pattern is not an array, it treated undefined
  if (!isArray(pattern)) {
    pattern = Array
  }

  const ListType = new Type(pattern)
  ListType.name = 'List'
  ListType.assert = function(...targets) {
    if (targets.length !== 1) {
      throw new HelloTypeError('list.arguments.length', { target: targets, type: this, ruleLength: 1, targetLength: targets.length })
    }

    let target = targets[0]
    if (!isArray(target)) {
      throw new HelloTypeError('list.array', { target, type: this })
    }

    let rule = this.rules[0]
    let error = this.vaildate(target, rule)
    if (error) {
      throw xError(error, { target, rule, type: this })
    }
  }
  return ListType
}
