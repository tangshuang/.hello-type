import Type from './type'
import Rule from './rule'
import { xError } from './utils'

export default function Tuple(...patterns) {
  const TupleType = new Type(...patterns)
  TupleType.name = 'Tuple'
  TupleType.assert = function(...args) {
    let rules = this.rules
    let ruleLen = rules.length
    let argLen = args.length
    let minLen = ruleLen

    if (this.mode === 'strict' && argLen !== ruleLen) {
      let error = new TypeError('arguments length not match ' + this.name + ' in strict mode')
      throw xError(error, { args, rules, type: this.name })
    }

    for (let i = ruleLen - 1; i > -1; i --) {
      let rule = rules[i]
      if (rule instanceof Rule && rule.name === 'IfExists') {
        minLen --
      }
      else {
        break
      }
    }

    if (argLen < minLen || argLen > ruleLen) {
      let error = new TypeError('arguments length not match ' + this.name)
      throw xError(error, { args, rules, type: this.name })
    }
    
    for (let i = 0; i < argLen; i ++) {
      let arg = args[i]
      let rule = rules[i]
      let error = this.vaildate(arg, rule)
      if (error) {
        throw xError(error, { arg, rule, index: i, args, rules, type: this.name })
      }
    }
  }
  return TupleType
}