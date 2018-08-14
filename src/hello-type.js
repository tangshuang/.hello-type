export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Range } from './range'
export { default as Rule, Any } from './rule'

import { throwError } from './utils'
import Assertion from './assertion'
import Decorator from './decorator'

export const HelloType = {
  expect(...args) {
    let assertion = new Assertion(...args)
    return assertion.expect(...args)
  },
  decorator: new Decorator(),
  set slient(mode) {
    throwError.slient = mode
  },
}

export default HelloType
