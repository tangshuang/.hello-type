import Type from './type'
import { xError } from './utils'

export default function Enum(...patterns) {
  const EnumType = new Type(...patterns)
  EnumType.name = 'Enum'
  EnumType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new Error('arguments length not match Enum')
      throw xError(error, { args, type: 'Enum' })
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
    
    let error = new Error('%arg does not match Enum(' + this.patterns.join(',') + ')')
    throw xError(error, { arg, rules, type: 'Enum' })
  }
  return EnumType
}