import Type from './type'
import { isArray, xError } from './utils'

export default function List(pattern) {
  // if pattern is not an array, it treated undefined
  if (!isArray(pattern)) {
    pattern = Array
  }

  const ListType = new Type(pattern)
  ListType.name = 'List'
  ListType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new Error('arguments length not match List')
      throw xError(error, { args, type: 'List' })
    }

    let arg = args[0]
    if (!isArray(arg)) {
      let error = new Error('%arg does not match List')
      throw xError(error, { arg, type: 'List' })
    }

    let rule = this.rules[0]
    let error = this.vaildate(arg, rule)
    if (error) {
      throw xError(error, { arg, rule, type: 'List' })
    }
  }
  return ListType
}