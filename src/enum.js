import Type from './type.js'
import { isInstanceOf } from './utils.js'
import { TxpeError } from './error.js'

export class Enum extends Type {
  constructor(...patterns) {
    super(...patterns)
    this.name = 'Enum'
  }
  assert(value) {
    let rules = this.rules
    for (let i = 0, len = rules.length; i < len; i ++) {
      let rule = rules[i]
      let match
      if (isInstanceOf(rule, Type)) {
        match = rule.test(value)
      }
      else {
        let type = new Type(rule)
        match = type.test(value)
      }

      // if there is one match, break the loop
      if (match) {
        return
      }
    }

    throw new TxpeError('shouldmatch', { value, type: this, level: 'assert' })
  }
}

export function enumerate(...patterns) {
  const type = new Enum(...patterns)
  return type
}

export default Enum
