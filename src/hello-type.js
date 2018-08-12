export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Rule } from './rule'

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
      let method = descriptor.value
      if (typeof method === 'function') {
        let decorator = function(...args) {
          decorate(...args)
          method.call(this, ...args)
        }
        descriptor.value = decorator
      }
      return descriptor
    }
    else {
      return descriptor
    }
  }
}

const decorator = {
  get expect() {
    let mode = this.mode
    return {
      typeof(type) {
        if (!(type instanceof Type)) {
          throw new Error('decorator.expect.typeof should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return modify(function(...args) {
          type.assert(...args)
        })
      },
    }
  },
  get trace() {
    let mode = this.mode
    return {
      logs: [],
      by(type) {
        if (!(type instanceof Type)) {
          throw new Error('decorator.trace.by should receive an instance of Type')
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
            if (typeof decorator.trace.onerror === 'function') {
              decorator.trace.onerror(obj)
            }
            else {
              decorator.trace.logs.push(obj)
            }
          })
        })
      },
      onerror: null,
      report() {
        let logs = decorator.trace.logs
        decorator.trace.logs = []
        return logs
      },
    }
  },
}

export const HelloType = {
  get decorator() {
    let mode = this.mode
    return Object.assign({}, decorator, { mode })
  },
  expect(...args) {
    let mode = this.mode
    return {
      typeof(type) {
        if (!(type instanceof Type)) {
          throw new Error('HelloType.expect.typeof should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        type.assert(...args)
      },
    }
  },
  catch(...args) {
    let mode = this.mode
    return {
      by(type) {
        if (!(type instanceof Type)) {
          throw new Error('HelloType.catch.by should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return type.catch(...args)
      },
    }
  },
  is(...args) {
    let mode = this.mode
    return {
      typeof(type) {
        if (!(type instanceof Type)) {
          throw new Error('HelloType.is.typeof should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return type.meet(...args)
      },
    }
  },
  trace(...args) {
    let mode = this.mode
    return {
      by(type) {
        if (!(type instanceof Type)) {
          throw new Error('HelloType.trace.by should receive an instance of Type')
        }
        if (mode === 'strict') {
          type = type.strict()
        }
        return type.trace(...args)
      },
    }
  },
  mode: 'none',
  get strict() {
    return Object.assign({}, HelloType, { mode: 'strict' })
  },
}

export default HelloType
