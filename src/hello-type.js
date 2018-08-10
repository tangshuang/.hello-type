export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'

const $exports = {
  strictMode: false,
  strict(mode) {
    this.strictMode = mode
  },
}

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

const decorator = Object.assign({}, $exports, {
  expect: {
    typeof(type) {
      if (!(type instanceof Type)) {
        throw new Error('decorator.expect.typeof should receive an instance of Type')
      }
      return modify(function(...args) {
        type.strict(decorator.strictMode).assert(...args)
      })
    },
  },
  trace: {
    logs: [],
    by(type) {
      if (!(type instanceof Type)) {
        throw new Error('decorator.trace.by should receive an instance of Type')
      }
      return modify(function(...args) {
        type.strict(decorator.strictMode).trace(...args).catch((error) => {
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
    }
  },
})

export const HelloType = Object.assign({}, $exports, {
  decorator,
  expect(...args) {
    return {
      typeof(type) {
        if (!(type instanceof Type)) {
          throw new Error('expect.typeof should receive an instance of Type')
        }
        type.strict(HelloType.strictMode).assert(...args)
      },
    }
  },
  is(...args) {
    return {
      typeof(type) {
        if (!(type instanceof Type)) {
          throw new Error('is.typeof should receive an instance of Type')
        }
        return type.strict(HelloType.strictMode).meet(...args)
      },
    }
  },
  trace(...args) {
    return {
      by(type) {
        if (!(type instanceof Type)) {
          throw new Error('trace.by should receive an instance of Type')
        }
        return type.strict(HelloType.strictMode).trace(...args)
      },
    }
  },
})

export default HelloType
