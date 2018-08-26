import Type from './type'
import { xError } from './utils'

export default function Enum(...patterns) {
  const EnumType = new Type(...patterns)
  EnumType.name = 'Enum'
  EnumType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new TypeError('arguments length not match ' + this.name)
      throw xError(error, { args, type: this.name })
    }
    
    let rules = this.rules
    let arg = args[0]
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let error = this.vaildate(arg, rule)
      if (!error) {
        // if there is one match, break the loop
        return
      }
    }
    
    let error = new TypeError(`%arg does not match ${this.name}(${this.patterns.join(',')})`)
    throw xError(error, { arg, rules, type: this.name })
  }
  return EnumType
}