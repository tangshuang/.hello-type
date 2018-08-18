import Type from './type'

export default function Enum(...patterns) {
  let EnumType = new Type(...patterns)
  EnumType.assert = function(...args) {
    if (args.length !== 1) {
      let error = new Error('arguments length not match Enum')
      error.arguments = args
      error.pattern = pattern
      throw error
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
    
    let error = new Error(typeof(arg) + ' does not match Enum(' + this.patterns.join(',') + ')')
    error.arguments = args
    error.pattern = pattern
    throw error
  }
  return EnumType
}