import Type from './type'
import Rule from './rule'

export default function Tuple(...patterns) {
  let TupleType = new Type(...patterns)
  TupleType.assert = function(...args) {
    let patterns = this.patterns
    let len = patterns.length

    if (this.mode === 'strict' && args.length !== len) {
      let error = new Error('arguments length not match Tuple in strict mode')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    for (let i = len - 1; i > -1; i --) {
      let pattern = patterns[i]
      if ((pattern instanceof Type || pattern instanceof Rule) && pattern.if_exists) {
        len --
      }
      else {
        break
      }
    }

    if (args.length < len || args.length > patterns.length) {
      let error = new Error('arguments length not match Tuple')
      error.arguments = args
      error.pattern = pattern
      throw error
    }

    let rules = this.rules
    for (let i = 0, len = args.length; i < len; i ++) {
      let arg = args[i]
      let pattern = rules[i]
      let error = this.vaildate(arg, pattern)
      if (error) {
        throw error
      }
    }
  }
  return TupleType
}