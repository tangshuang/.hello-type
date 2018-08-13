import { throwError } from './utils'

export default class Assertion {
  constructor() {
    this.paths = []
    this.targets = []
    this.mode = 'none'
  }
  expect(...targets) {
    this.paths.push('expect')
    this.targets = targets
    return this
  }
  get to() {
    if (this.paths.join('.') !== 'expect') {
      return throwError('syntax should be HelloType.expect(type).to..., `to` should be follow `expect`')
    }

    this.paths.push('to')
    return this
  }
  get strictly() {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect(type).to.strictly.be.typeof..., `strictly` should be follow `to`')
    }

    this.mode = 'strict'
    return this
  }
  get be() {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect(type).to.be.typeof..., `be` should be follow `to`')
    }

    this.paths.push('be')
    return this
  }
  typeof(...args) {
    if (this.paths.join('.') !== 'expect.to.be') {
      return throwError('syntax should be HelloType.expect(type).to.be.typeof(target)')
    }

    let type = this.targets[0]
    if (this.mode === 'strict') {
      type = type.strict
    }
    type.assert(...args)
  }
  match(type) {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect(target).to.match(type)')
    }

    if (this.mode === 'strict') {
      type = type.strict
    }
    return type.assert(...this.targets)
  }
  test(...args) {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect(type).to.test(target)')
    }

    let type = this.targets[0]
    if (this.mode === 'strict') {
      type = type.strict
    }
    return type.test(...args)
  }
  catch(...args) {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect(type).to.catch(target)')
    }

    let type = this.targets[0]
    if (this.mode === 'strict') {
      type = type.strict
    }
    return type.catch(...args)
  }
  trace(...args) {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect(type).to.trace(target)')
    }

    let type = this.targets[0]
    if (this.mode === 'strict') {
      type = type.strict
    }
    return type.trace(...args)
  }
}