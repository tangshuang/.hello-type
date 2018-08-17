import Type from './type'

export default class Rule {
  constructor(factory) {
    this.factory = factory
  }
}

export const Any = new Rule(() => null)

export const IfExists = function(pattern) {
  if (!(pattern instanceof Rule) && !(pattern instanceof Type)) {
    pattern = new Type(pattern)
  }
  pattern.if_exists = true
  return pattern
}
