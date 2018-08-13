export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Rule } from './rule'

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

export const HelloType = {
  get decorator() {
    let mode = this.mode
    return {
      expect(type) {
        if (!(type instanceof Type)) {
          throwError('HelloType.decorator.expect should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return modify(function(...args) {
          type.assert(...args)
        })
      },
      traceBy(type, onerror) {
        if (!(type instanceof Type)) {
          throwError('HelloType.decorator.traceBy should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return modify(function(...args) {
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
      },
    }
  },
  typeof(...args) {
    let mode = this.mode
    return {
      expect(type) {
        if (!(type instanceof Type)) {
          throwError('HelloType.typeof.expect should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        type.assert(...args)
      },
      is(type) {
        if (!(type instanceof Type)) {
          throwError('HelloType.typeof.is should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return type.meet(...args)
      },
      catchBy(type) {
        if (!(type instanceof Type)) {
          throwError('HelloType.typeof.catchBy should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return type.catch(...args)
      },
      traceBy(type, onerror) {
        if (!(type instanceof Type)) {
          throwError('HelloType.typeof.traceBy should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return type.trace(...args).catch((error) => {
          let obj = {
            args,
            type,
            error,
          }
          if (typeof onerror === 'function') {
            onerror(obj)
          }
          else {
            throw error
          }
        })
      },
    }
  },
  mode: 'none',
  get strict() {
    return Object.assign({}, HelloType, { mode: 'strict' })
  },
  set slient(mode) {
    throwError.slient = mode
  },
}

export default HelloType
