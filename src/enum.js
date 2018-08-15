import Type from './type'

export default function Enum(...patterns) {
  let EnumType = new Type(...patterns)
  EnumType.assert = function(arg) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      try {
        this.vaildate(arg, rule)
        // if there is one rule match, it pass
        return true
      }
      catch(e) {}
    }
    
    throw new Error(`"${arg}" is not match Enum(${this.patterns.join(',')})`)
  }
  return EnumType
}