export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { default as Rule, Any, IfExists } from './rule'

import { decorate } from './utils'

export const HelloType = {
  /**
   * assert
   * @param {Type} type 
   * @example
   * HelloType.expect(SomeType).toBe.typeof(arg)
   */
  expect: (type) => ({
    toBe: {
      typeof: (...targets) => type.assert(...targets),
    },
  }),

  /**
   * determine whether type match
   * @param {Type} type 
   * @example
   * let bool = HelloType.is(SomeType).typeof(arg)
   */
  is: (type) =>  ({
    typeof: (...targets) => type.test(...targets),
  }),

  /**
   * catch error by SomeType
   * @param {*} targets 
   * @example
   * let error = HelloType.catch(arg).by(SomeType)
   */
  catch: (...targets) => ({
    by: (type) => type.catch(...targets),
  }),

  /**
   * track args by SomeType
   * @param {*} targets 
   * @example
   * HelloType.trace(arg).by(SomeType).with(fn)
   */
  trace: (...targets) => ({
    by: (type) => ({
      with: (fn) => type.trace(...targets).with(fn),
    }),
  }),

  /**
   * @example
   * @HelloType.decorate.with((arg) => SomeType.assertf(arg))
   */
  decorate: {
    with: (fn) => decorate(function(...args) {
      fn(...args)
    }),
  },
}

export default HelloType
