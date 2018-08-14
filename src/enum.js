import Type from './type'

export default function Enum(...patterns) {
  let EnumType = new Type(...patterns)
  EnumType.assert = function(arg) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let result = this.vaildate(arg, rule)
      if (result === true) {
        return true
      }
    }
    
    throw new Error(`"${arg}" is not match Enum(${this.patterns.join(',')})`)
  }
  return EnumType
}