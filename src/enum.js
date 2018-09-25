import Type from './type'
import { isInstanceOf } from './utils'
import { HelloTypeError } from './error'

export default function Enum(...patterns) {
  const EnumType = new Type(...patterns)
  EnumType.name = 'Enum'
  EnumType.assert = function(...targets) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let match
      if (isInstanceOf(rule, Type)) {
        match = rule.test(...targets)
      }
      else {
        let type = new Type(rule)
        match = type.test(...targets)
      }

      // if there is one match, break the loop
      if (match) {
        return
      }
    }
    
    throw new HelloTypeError('enum', { target: targets, rule: rules, type: this.name })
  }
  return EnumType
}