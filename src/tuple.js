import Type from './type.js'
import Rule from './rule.js'
import { isInstanceOf } from './utils.js'
import { xError, TxpeError } from './error.js'

export class Tuple extends Type {
  constructor(...patterns) {
    super(...patterns)
    this.name = 'Tuple'
  }
  assert(...targets) {
    let rules = this.rules
    let ruleCount = rules.length
    let targetCount = targets.length
    let minLen = ruleCount

    if (this.mode === 'strict' && targetCount !== ruleCount) {
      throw new TxpeError('dirty', { type: this, level: 'assert', length: ruleCount })
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
      throw new TxpeError('dirty', { type: this, level: 'assert', length: ruleCount })
    }

    for (let i = 0; i < targetCount; i ++) {
      let value = targets[i]
      let rule = rules[i]
      let error = this.validate(value, rule)
      if (error) {
        throw xError(error, { value, rule, type: this, level: 'assert' })
      }
    }
  }
}

export function tuple(...patterns) {
  const type = new Tuple(...patterns)
  return type
}

export default Tuple
