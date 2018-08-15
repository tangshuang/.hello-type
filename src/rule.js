import Type from './type'

export default class Rule {
  constructor(factory) {
    this.factory = factory
  }
}

export const Any = new Rule(() => true)

export const Self = new Rule(function(value) {
  return this.test(value)
})

export const IfExists = function(pattern) {
  if (!(pattern instanceof Rule) && !(pattern instanceof Type)) {
    pattern = new Type(pattern)
  }
  pattern.if_exists = true
  return pattern
}
