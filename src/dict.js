import Type from './type'
import { isObject, isEmpty } from './utils'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  // if pattern is an empty object, it treated to be an Object
  if (isEmpty(pattern)) {
    pattern = Object
  }

  let DictType = new Type(pattern)
  DictType.assert = function(...args) {
    if (args.length !== 1) {
      throw new Error('arguments length not match Dict')
    }

    let arg = args[0]
    if (!isObject(arg)) {
      throw new Error(`"${typeof(arg)}" not match Dict`)
    }

    let rule = this.rules[0]
    let error = this.vaildate(arg, rule)
    if (error) {
      throw error
    }
  }
  return DictType
}