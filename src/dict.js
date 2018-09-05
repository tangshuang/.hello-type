import Type from './type'
import { isObject, xError, stringify } from './utils'
import { criticize } from './messages'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  const DictType = new Type(pattern)
  DictType.name = 'Dict'
  DictType.assert = function(...args) {
    if (args.length !== 1) {
      let message = criticize('dict.arguments.length', { 
        args: stringfy(args), 
        name: this.toString(),
        length: 1,
      })
      let error = new TypeError(message)
      throw xError(error, { args, type: this.name })
    }

    let arg = args[0]
    if (!isObject(arg)) {
      let message = criticize('dict.object', { 
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
  return DictType
}