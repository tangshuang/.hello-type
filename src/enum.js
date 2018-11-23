import Type from './type'
import { isInstanceOf } from './utils'
import { HelloTypeError } from './error'

export default function Enum(...patterns) {
  const EnumType = new Type(...patterns)
  EnumType.name = 'Enum'
  EnumType.assert = function(target) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let match
      if (isInstanceOf(rule, Type)) {
        match = rule.test(target)
      }
      else {
        let type = new Type(rule)
        match = type.test(target)
      }

      // if there is one match, break the loop
      if (match) {
        return
      }
    }

    throw new HelloTypeError('enum', { target, rule: rules, type: this })
  }
  return EnumType
}
