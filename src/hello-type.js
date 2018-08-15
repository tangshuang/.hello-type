export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { default as Rule, Any, Self, IfExists } from './rule'

import { decorate } from './utils'

const decorator = {
  expect(type) {
    let mode = false
    let runner = {
      get typeof() {
        if (mode) {
          type = type.strict
        }
        return decorate(function(...args) {
          type.assert(...args)
        })
      },
    }
    return {
      toBe: Object.assign({}, runner, {
        get strict() {
          mode = true
          return runner
        },
      })
    }
  },
  get trace() {
    let mode = false
    let runner = {
      by(type) {
        return {
          catch(fn) {
            if (mode) {
              type = type.strict
            }
            return decorate(function(...args) {
              type.trace(...args).catch((error) => {
                fn(error, args)
              })
            })
          }
        }
      },
    }
    return Object.assign({}, runner, {
      get strictly() {
        mode = true
        return runner
      },
    })
  },
}

export const HelloType = {
  expect(type) {
    let mode = false
    let runner = {
      typeof(...targets) {
        if (mode) {
          type = type.strict
        }
        type.assert(...targets)
      },
    }
    return {
      toBe: Object.assign({}, runner, {
        get strict() {
          mode = true
          return runner
        },
      })
    }
  },
  is(type) {
    let mode = false
    let runner = {
      typeof(...targets) {
        if (mode) {
          type = type.strict
        }
        return type.test(...targets)
      }
    }
    return Object.assign({}, runner, {
      get strict() {
        mode = true
        return runner
      }
    })
  },
  catch(...targets) {
    let mode = false
    let runner = {
      by(type) {
        if (mode) {
          type = type.strict
        }
        return type.catch(...targets)
      }
    }
    return Object.assign({}, runner, {
      get strictly() {
        mode = true
        return runner
      }
    })
  },

  /**
   * track args by SomeType
   * @param {*} targets 
   * @example
   * HelloType.trace(arg).by(SomeType).with(fn)
   */
  trace(...targets) {
    let mode = false
    let runner = {
      by(type) {
        return {
          with(fn) {
            if (mode) {
              type = type.strict
            }
            type.trace(...targets).with(fn)
          }
        }
      }
    }
    return Object.assign({}, runner, {
      get strictly() {
        mode = true
        return runner
      }
    })
  },
}

export default HelloType
