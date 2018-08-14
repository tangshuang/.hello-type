export default class Rule {
  constructor(factory) {
    this.factory = factory
  }
}

export const Any = new Rule(() => true)

export const Self = new Rule(function() {
  return this
})
