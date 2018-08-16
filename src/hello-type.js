export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { default as Rule, Any, Self, IfExists } from './rule'

import { decorate } from './utils'

export const HelloType = {
  /**
   * assert
   * @param {Type} type 
   * @example
   * HelloType.expect(SomeType).toBe.strictly.typeof(arg)
   */
  expect(type) {
    let mode = false
    let runner = {
      typeof(...targets) {
        if (mode) {
          type = type.strictly
        }
        type.assert(...targets)
      },
    }
    return {
      toBe: Object.assign({}, runner, {
        get strictly() {
          mode = true
          return runner
        },
      })
    }
  },

  /**
   * determine whether type match
   * @param {Type} type 
   * @example
   * let bool = HelloType.is(SomeType).strictly.typeof(arg)
   */
  is(type) {
    let mode = false
    let runner = {
      typeof(...targets) {
        if (mode) {
          type = type.strictly
        }
        return type.test(...targets)
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
   * catch error by SomeType
   * @param {*} targets 
   * @example
   * let error = HelloType.catch(arg).strictly.by(SomeType)
   */
  catch(...targets) {
    let mode = false
    let runner = {
      by(type) {
        if (mode) {
          type = type.strictly
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
   * HelloType.trace(arg).strictly.by(SomeType).with(fn)
   */
  trace(...targets) {
    let mode = false
    let runner = {
      by(type) {
        return {
          with(fn) {
            if (mode) {
              type = type.strictly
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

  /**
   * @example
   * @HelloType.decorate.with((arg) => HelloType.expect(SomeType).toBe.typeof(arg))
   */
  get decorate() {
    return {
      with(fn) {
        return decorate(function(...args) {
          fn(...args)
        })
      },
    }
  }
}

export default HelloType
