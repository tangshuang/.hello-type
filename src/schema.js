import Dict from './dict.js'
import List from './list.js'
import { isObject, isArray, isNumber, isInstanceOf, isNumeric, isEmpty, isFunction, clone, makeKeyChain } from './utils.js'
import Ts from './ts.js'
import Type from './type.js'
import TsError, { makeError } from './error.js'
import Tuple from './tuple.js'
import Rule from './rule.js';

export class Schema {
  /**
   * 数据源相关信息
   * @param {object} definition
   * {
   *   // 字段名，值为一个配置
   *   key: {
   *     default: '', // 必填，默认值
   *     type: String, // 必填，数据类型 Pattern
   *   },
   *   // 使用一个 schema 实例作为值，schema 本身是有默认值的
   *   prop: SomeSchema,
   * }
   */
  constructor(definition) {
    this.definition = definition

    const makeType = (definition) => {
      const keys = Object.keys(definition)
      const pattern = {}
      keys.forEach((key) => {
        const def = definition[key]
        if (isInstanceOf(def, Schema)) {
          pattern[key] = makeType(def.definition)
        }
        else {
          pattern[key] = def.type
        }
      })
      return new Dict(pattern)
    }
    this.type = makeType(definition)
  }

  throw(error) {
    console.error(error)
  }

  /**
   * 断言给的值是否符合 schema 的要求
   * @todo 由于Schema是不会发生变化的，因此可以使用纯函数缓存功能
   * @param {*} data
   */
  validate(data) {
    if (!isObject(data)) {
      let error = new TsError(`schema validate data should be an object.`)
      return error
    }

    return this.type.catch(data)
  }

  /**
   * 通过传入的数据定制符合 schema 的输出数据
   * @todo 由于Schema是不会发生变化的，因此可以使用纯函数缓存功能
   * @param {*} data
   */
  formulate(data) {
    if (!isObject(data)) {
      data = {}
    }

    const definition = this.definition
    const keys = Object.keys(definition)
    const output = {}

    keys.forEach((key) => {
      const def = definition[key]
      const defaultValue = def.default
      const value = data[key]

      let comming = null

      if (isInstanceOf(def, Schema)) {
        comming = def.formulate(value)
      }
      else {
        const { type } = def
        const info = { key, value, pattern: type, schema: this, level: 'schema', action: 'validate' }
        let error = isInstanceOf(type, Type) ? type.catch(value) : isInstanceOf(type, Rule) ? type.validate2(value, key, target) : Tx.catch(value).by(type)
        if (error) {
          error = makeError(error, info)
          this.throw(error)
          comming = clone(defaultValue)
        }
        else {
          comming = clone(value)
        }
      }

      output[key] = comming
    })

    return output
  }

  /**
   * 在原来的基础上进行扩展。
   * 需要注意的是，如果传入的 field 在原来中存在，会使用传入的 field 配置全量覆盖原来的。
   * @param {*} fields
   */
  extend(fields) {
    const definition = this.definition
    const next = { ...definition, fields }
    const schema = new Schema(next)
    return schema
  }

  /**
   * 从原来的基础上选出部分
   * @param {*} fields
   */
  extract(fields) {
    const definition = this.definition
    const keys = Object.keys(fields)
    const next = {}

    keys.forEach((key) => {
      if (fields[key] === true) {
        let pattern = definition[key]
        next[key] = pattern
      }
    })

    const schema = new Schema(next)
    return schema
  }

  mix(fields) {
    const definition = this.definition
    const keys = Object.keys(fields)
    const next = {}

    keys.forEach((key) => {
      if (fields[key] === true) {
        next[key] = definition[key]
      }
      else if (isObject(fields[key])) {
        next[key] = fields[key]
      }
    })

    const schema = new Schema(next)
    return schema
  }

}

export default Schema
