import Type from './type'
import Rule from './rule'

export default function Tuple(...patterns) {
  let TupleType = new Type(...patterns)
  TupleType.assert = function(...args) {
    let patterns = this.patterns
    let len = patterns.length

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
      throw new Error('arguments length not match Tuple')
    }

    for (let i = 0, len = args.length; i < len; i ++) {
      let arg = args[i]
      let pattern = this.rules[i]
      this.vaildate(arg, pattern)
    }
  }
  return TupleType
}