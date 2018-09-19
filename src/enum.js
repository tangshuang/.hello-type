import Type from './type'
import { xError, stringify, isInstanceOf } from './utils'
import { criticize } from './messages'

export default function Enum(...patterns) {
  const EnumType = new Type(...patterns)
  EnumType.name = 'Enum'
  EnumType.assert = function(...args) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let match
      if (isInstanceOf(rule, Type)) {
        match = rule.test(...args)
      }
      else {
        let type = new Type(rule)
        match = type.test(...args)
      }

      // if there is one match, break the loop
      if (match) {
        return
      }
    }
    
    let message = criticize('enum', { 
      args: stringify(args), 
      name: this.toString(), 
      rules: this.rules.join(','),
    })
    let error = new TypeError(message)
    throw xError(error, { args, rules, type: this.name })
  }
  return EnumType
}