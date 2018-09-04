import Type from './type'
import { xError } from './utils'

export default function Enum(...patterns) {
  const EnumType = new Type(...patterns)
  EnumType.name = 'Enum'
  EnumType.assert = function(...args) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let match
      if (rule instanceof Type) {
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
    
    let error = new TypeError(`%args does not match ${this.name}(${this.patterns.join(',')})`)
    throw xError(error, { args, rules, type: this.name })
  }
  return EnumType
}