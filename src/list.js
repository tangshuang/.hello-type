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
      let error = new TypeError('arguments length not match ' + this.name)
      throw xError(error, { args, type: this.name })
    }

    let arg = args[0]
    if (!isArray(arg)) {
      let error = new TypeError('%arg does not match ' + this.name)
      throw xError(error, { arg, type: this.name })
    }

    let rule = this.rules[0]
    let error = this.vaildate(arg, rule)
    if (error) {
      throw xError(error, { arg, rule, type: this.name })
    }
  }
  return ListType
}