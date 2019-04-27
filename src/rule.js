import Type from './type.js'
import { isFunction, isInstanceOf, isNumber, isString, isBoolean, inObject, isNumeric, isNull, isUndefined } from './utils.js'
import { xError, TsError } from './error.js'

export class Rule {
  /**
   *
   * @param {*} name
   * @param {*} validate should must return an error or null
   * @param {*} override
   */
  constructor(name, validate, override) {
    if (isFunction(name)) {
      override = validate
      validate = name
      name = null
    }

    this.validate = validate
    this.override = override
    this.name = name || 'Rule'
  }
  toString() {
    return this.name
  }
}

export default Rule
