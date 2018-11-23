import Type from './type'
import Rule from './rule'
import { isInstanceOf } from './utils'
import { xError, HelloTypeError } from './error'

export default function Tuple(...patterns) {
  const TupleType = new Type(...patterns)
  TupleType.name = 'Tuple'
  TupleType.assert = function(...targets) {
    let rules = this.rules
    let ruleLength = rules.length
    let targetLength = targets.length
    let minLen = ruleLength

    if (this.mode === 'strict' && targetLength !== ruleLength) {
      throw new HelloTypeError('tuple.strict.arguments.length', { target: targets, type: this, ruleLength, targetLength })
    }

    for (let i = ruleLength - 1; i > -1; i --) {
      let rule = rules[i]
      if (isInstanceOf(rule, Rule) && rule.name === 'IfExists') {
        minLen --
      }
      else {
        break
      }
    }

    if (targetLength < minLen || targetLength > ruleLength) {
      throw new HelloTypeError('tuple.arguments.length', { target: targets, type: this, ruleLength, targetLength, minLen })
    }

    for (let i = 0; i < targetLength; i ++) {
      let target = targets[i]
      let rule = rules[i]
      let error = this.vaildate(target, rule)
      if (error) {
        throw xError(error, { target, type: this })
      }
    }
  }
  return TupleType
}
