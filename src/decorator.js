import { throwError } from './utils'

const modify = function(decorate) {
  return function(target, prop, descriptor) {
    // decorate class constructor function
    if (target && !prop) {
      return class extends target {
        constructor(...args) {
          decorate(...args)
          super(...args)
        }
      }
    }
    // decorate class member function
    else if (prop) {
      let property = descriptor.value
      if (typeof property === 'function') {
        let wrapper = function(...args) {
          decorate(...args)
          property.call(this, ...args)
        }
        descriptor.value = wrapper
      }
      else {
        descriptor.set = (value) => {
          decorate(value)
          descriptor.value = value
        }
      }
      return descriptor
    }
    else {
      return descriptor
    }
  }
}

export default class {
  constructor() {
    this.paths = []
    this.mode = 'none'
  }
  get expect() {
    this.paths.push('expect')
    return this
  }
  get to() {
    if (this.paths.join('.') !== 'expect') {
      return throwError('syntax should be @HelloType.expect.to..., `to` should be follow `expect`')
    }

    this.paths.push('to')
    return this
  }
  get strictly() {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be @HelloType.expect.to.strictly.be..., `strictly` should be follow `to`')
    }

    this.mode = 'strict'
    return this
  }
  get be() {
    if (this.paths.join('.') !== 'expect.to') {
      return throwError('syntax should be HelloType.expect.to.be.matched.with..., `be` should be follow `to`')
    }

    this.paths.push('be')
    return this
  }
  get matched() {
    if (this.paths.join('.') !== 'expect.to.be') {
      return throwError('syntax should be HelloType.expect.to.be.matched.with..., `matched` should be follow `be`')
    }

    this.paths.push('matched')
    return this
  }
  with(type) {
    if (this.paths.join('.') !== 'expect.to.be.matched') {
      return throwError('syntax should be HelloType.expect.to.be.matched.with(type), `with` should be follow `matched`')
    }

    return modify(function(...args) {
      if (this.mode === 'strict') {
        type = type.strict
      }
      type.assert(...args)
    })
  }
  get traced() {
    if (this.paths.join('.') !== 'expect.to.be') {
      return throwError('syntax should be HelloType.expect.to.be.traced.by(type), `matched` should be follow `be`')
    }

    this.paths.push('traceed')
    return this
  }
  by(type, onerror) {
    if (this.paths.join('.') !== 'expect.to.be.traced') {
      return throwError('syntax should be HelloType.expect.to.be.traced.by(type), `by` should be follow `traced`')
    }

    return modify(function(...args) {
      if (this.mode === 'strict') {
        type = type.strict
      }
      type.trace(...args).catch((error) => {
        let obj = {
          args,
          type,
          error,
        }
        if (typeof onerror === 'function') {
          onerror(obj)
        }
      })
    })
  }
}
