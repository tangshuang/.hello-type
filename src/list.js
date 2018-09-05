import Type from './type'
import { isArray, xError, stringify } from './utils'
import { criticize } from './messages'

export default function List(pattern) {
  // if pattern is not an array, it treated undefined
  if (!isArray(pattern)) {
    pattern = Array
  }

  const ListType = new Type(pattern)
  ListType.name = 'List'
  ListType.assert = function(...args) {
    if (args.length !== 1) {
      let message = criticize('list.arguments.length', { 
        args: stringify(args),
        name: this.toString(),
        length: 1,
      })
      let error = new TypeError(message)
      throw xError(error, { args, type: this.name })
    }

    let arg = args[0]
    if (!isArray(arg)) {
      let message = criticize('list.array', {
        arg: stringify(arg),
        name: this.toString(),
      })
      let error = new TypeError(message)
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