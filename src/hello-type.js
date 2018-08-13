export { default as Type } from './type'
export { default as Dict } from './dict'
export { default as List } from './list'
export { default as Tuple } from './tuple'
export { default as Enum } from './enum'
export { default as Rule } from './rule'

import Assertion from './assertion'
import { throwError } from './utils'
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
