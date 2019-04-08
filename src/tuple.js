import Type from './type'
import Rule from './rule'
import { isInstanceOf } from './utils'
import { xError, ErrorX } from './error'

export function Tuple(...patterns) {
  const TupleType = new Type(...patterns)
  TupleType.name = 'Tuple'
  TupleType.assert = function(...targets) {
    let rules = this.rules
    let ruleCount = rules.length
    let targetCount = targets.length
    let minLen = ruleCount

    if (this.mode === 'strict' && targetCount !== ruleCount) {
      throw new ErrorX('dirty', { type: this, action: 'assert', length: ruleCount })
    }

    for (let i = ruleCount - 1; i > -1; i --) {
      let rule = rules[i]
      if (isInstanceOf(rule, Rule) && rule.name === 'IfExists') {
        minLen --
      }
      else {
        break
      }
    }

    if (targetCount < minLen || targetCount > ruleCount) {
      throw new ErrorX('dirty', { type: this, action: 'assert', length: ruleCount })
    }

    for (let i = 0; i < targetCount; i ++) {
      let value = targets[i]
      let rule = rules[i]
      let error = this.validate(value, rule)
      if (error) {
        throw xError(error, { value, rule, type: this, action: 'assert' })
      }
    }
  }
  return TupleType
}
export default Tuple
