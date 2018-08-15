export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { default as Rule, Any, Self } from './rule'

import { decorate } from './utils'

class HelloTypeChains {
  constructor() {
    this.paths = []
    this.mode = 'none'
  }

  expect(type) {
    this.paths.push('expect')
    this.type = type
    return this
  }
  get toBe() {
    this.paths.push('toBe')
    return this
  }
  is(type) {
    this.paths.push('is')
    this.type = type
    return this
  }
  trace(...targets) {
    this.paths.push('trace')
    this.targets = targets
    return this
  }
  catch(...targets) {
    this.paths.push('catch')
    this.targets = targets
    return this
  }

  by(type) {
    this.paths.push('by')
    this.type = type
    return this.emit()
  }
  typeof(...targets) {
    this.paths.push('typeof')
    this.targets = targets
    return this.emit()
  }

  emit() {
    let path = this.paths.join('.')
    let type = this.mode === 'strict' ? this.type.strict : this.type
    let targets = this.targets
    switch (path) {
      case 'expect.toBe.typeof': return type.assert(...targets)
      case 'is.typeof': return type.test(...targets)
      case 'trace.by': return type.trace(...targets)
      case 'catch.by': return type.catch(...targets)
      default: return null
    }
  }

  get strict() {
    let chains = new HelloTypeChains()
    chains.mode = 'strict'
    return chains
  }

  get decorator() {
    let decorator = new HelloTypeDecorator()
    decorator.mode = this.mode
    return decorator
  }
}

class HelloTypeDecorator {
  constructor() {
    this.paths = []
    this.mode = 'none'
  }

  expect(type) {
    this.paths.push('expect')
    this.type = type
    return this.emit
  }

  get trace() {
    this.paths.push('trace')
    return this
  }
  by(type) {
    this.paths.push('by')
    this.type = type
    return this
  }
  catch(fn) {
    this.paths.push('catch')
    this.fn = fn
    return this.emit()
  }

  emit() {
    let path = this.paths.join('.')
    let type = this.mode === 'strict' ? this.type.strict : this.type
    if (path === 'expect') {
      return decorate(function(...args) {
        type.assert(...args)
      })
    }
    else if (path === 'trace.by.catch') {
      let fn = this.fn
      return decorate(function(...args) {
        type.trace(...args).catch((error) => {
          let obj = {
            args,
            type,
            error,
          }
          fn(obj)
        })
      })
    }
    else {
      return decorate()
    }
  }
}

export const HelloType = new HelloTypeChains()
export default HelloType
