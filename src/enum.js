import Type from './type'

export default function Enum(...patterns) {
  let EnumType = new Type(...patterns)
  EnumType.assert = function(...args) {
    if (args.length !== 1) {
      throw new Error('arguments length not match Enum')
    }

    let arg = args[0]
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let error = this.vaildate(arg, rule)
      if (!error) {
        // if there is one match, break the loop
        return
      }
    }
    
    throw new Error(`"${arg}" is not match Enum(${this.patterns.join(',')})`)
  }
  return EnumType
}