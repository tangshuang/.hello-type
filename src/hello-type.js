export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { 
  default as Rule, 
  Any, Null, Undefined, 
  IfExists, IfNotMatch, Equal, InstanceOf, Lambda,
} from './rule'

import { decorate } from './utils'

export const HelloType = {
  /**
   * assert
   * @param {Type} type 
   * @example
   * HelloType.expect(arg).toMatch(SomeType)
   */
  expect: (...targets) => ({
    toMatch: (type) => {
      try {
        type.assert(...targets)
      }
      catch(e) {
        if (HelloType.slient) {
          console.error(e)
        }
        else {
          throw e
        }
      }
    },
    toBeCatchedBy: (type) => type.catch(...targets),
    toBeTracedBy: (type) => ({
      with: (fn) => type.trace(...targets).with(fn),
    }),
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
   * @example
   * @HelloType.decorate.with((arg) => SomeType.assertf(arg))
   */
  decorate: {
    input: {
      with: (fn) => decorate(function(...args) {
        fn(...args)
      }, 'input'),
    },
    output: {
      with: (fn) => decorate(function(...args) {
        fn(...args)
      }, 'output'),
    },
    with: (fn) => decorate(function(...args) {
      fn(...args)
    }),
  },

  /**
   * whether to use console.error instead of throw when using HelloType.expect.toMatch
   */
  slient: false,
}

export default HelloType
