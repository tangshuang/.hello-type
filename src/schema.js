import Dict from './dict.js'
import List from './list.js'
import { isObject, isArray, isNumber, isInstanceOf, isNumeric, isEmpty, isFunction, clone, makeKeyChain } from './utils.js'
import Ts from './ts.js'
import Type from './type.js'
import TsError, { makeError } from './error.js'
import Tuple from './tuple.js'

export class Schema {
  /**
   * 数据源相关信息
   * @param {object} definition
   * {
   *   // 字段名
   *   key: {
   *     default: '', // 必填，默认值
   *     type: String, // 可选，数据类型
   *       // 当 type 为 schema 时，要求输出的数据结构必须和 default 一致
   *
   *     // 准备数据，格式化数据
   *     flat: (value) => ({ keyPath: value }), // 可选
   *       // 在将一个字段展开为两个字段的时候会用到它。
   *       // 注意，使用了 flat，如果想在结果中移除原始 key，还需要使用 drop。
   *       // 例如： flat: (region) => ({ 'company.region_id': region.region_id }) 会导致最后在格式化数据中，会有一个 company.region_id 属性出现
   *       // flat 的优先级更高，它会在 drop 之前运行，因此，drop 对它没有影响，这也符合逻辑，flat 之后，如果需要从原始数据中删除自身，需要设置 drop
   *     drop: (value) => Boolean, // 可选，是否要丢掉当前字段，true 表示丢到，false 表示保留
   *     map: (value) => newValue, // 可选，使用新值覆盖原始值输出，例如 map: region => region.region_id 使当前这个字段使用 region.region_id 作为最终结果输出。
   *       // 注意：它仅在 drop 为 false 的情况下生效，drop 为 true，map结果不会出现在结果中。
   *   },
   * }
   */
  constructor(definition) {
    this.definition = definition
  }

  throw(error) {
    console.error(error)
  }

  /**
   * 获取当前 schema 的 type 结构
   * @param {*} [keyPath]
   */
  type(keyPath) {
    const getPattern = (type) => {
      if (isInstanceOf(type, Dict)) {
        type = getPattern(type.pattern)
      }
      else if (isInstanceOf(type, List)) {
        type = type.pattern.map(item => getPattern(item))
      }
      else if (isInstanceOf(type, Tuple)) {
        type = type.pattern.map(item => getPattern(item))
        type.__isTuple = true
      }
      else if (isObject(type)) {
        type = map(type, item => getPattern(item))
      }
      else if (isArray(type)) {
        type = type.map(item => getPattern(item))
      }
      return type
    }

    const definition = this.definition
    const keys = Object.keys(definition)
    var pattern = {}

    if (this.__patternCache) {
      pattern = this.__patternCache
    }
    else {
      keys.forEach((key) => {
        const { type } = definition[key]
        let o = null
        if (isInstanceOf(type, Schema)) {
          let dict = type.type()
          o = getPattern(dict)
        }
        else {
          o = getPattern(type)
        }
        pattern[key] = o
      })

      // 在短时间内复用缓存
      this.__patternCache = pattern
      clearTimeout(this.__patternCacheClear)
      this.__patternCacheClear = setTimeout(() => {
        delete this.__patternCache
      })
    }

    if (keyPath) {
      let chain = makeKeyChain(keyPath)
      if (!chain.length) {
        return new Dict(pattern)
      }

      let target = pattern
      for (let i = 0, len = chain.length; i < len; i ++) {
        let key = chain[i]
        if ((!isObject(target) && !isArray(target)) || target[key] === undefined) {
          return undefined
        }
        target = target[key]
      }

      if (isObject(target)) {
        return new Dict(target)
      }
      else if (isArray(target)) {
        if (target.__isTuple) {
          return new Tuple(target)
        }
        else {
          return new List(target)
        }
      }
    }

    return new Dict(pattern)
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

    const definition = this.definition
    const keys = Object.keys(definition)

    const validate = (key, value) => {
      const { type } = definition[key]
      const info = { key, value, pattern: type, schema: this, level: 'schema', action: 'validate' }
      // 类型检查
      let error = (type instanceof Schema) ? type.validate(value) : Ts.catch(value).by(type)
      if (error) {
        return makeError(error, info)
      }
    }

    for (let i = 0, len = keys.length; i < len; i ++) {
      let key = keys[i]
      let value = data[key]

      let error = validate(key, value)
      if (error) {
        return error
      }
    }
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

    const validate = (key, value) => {
      const { type } = definition[key]
      const info = { key, value, pattern: type, schema: this, level: 'schema', action: 'validate' }
      // 类型检查
      let error = (type instanceof Schema) ? type.validate(value) : Ts.catch(value).by(type)
      if (error) {
        return makeError(error, info)
      }
    }

    keys.forEach((key) => {
      const pattern = definition[key]
      const { type, flat, drop, map } = pattern
      const defaultValue = pattern.default
      const value = data[key]

      let comming = null

      if (isInstanceOf(type, Schema)) {
        comming = type.formulate(value)
      }
      else {
        let error = validate(key, value)
        if (error) {
          this.throw(error)
          comming = clone(defaultValue)
        }
        else {
          comming = clone(value)
        }
      }

      if (isFunction(flat)) {
        let mapping = flat.call(this, comming)
        let mappingKeys = Object.keys(mapping)
        mappingKeys.forEach((key) => {
          let value = mapping[key]
          assign(output, key, value)
        })
      }

      if (isFunction(drop) && drop.call(this, comming)) {
        return
      }
      else if (isBoolean(drop) && drop) {
        return
      }

      if (isFunction(map)) {
        comming = map.call(this, comming)
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
  extends(fields) {
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
    const keys = Object.keys(definition)
    const next = {}

    const useKeys = []
    const removeKeys = []
    const passKeys = Object.keys(fields)

    passKeys.forEach((key) => {
      let value = fields[key]
      if (value === true) {
        useKeys.push(key)
      }
      else if (value === false) {
        removeKeys.push(key)
      }
    })

    const passCount = passKeys.length
    const removeCount = removeKeys.length
    const useCount = useKeys.length

    keys.forEach((key) => {
      const willing = fields[key]

      if (willing === false) {
        return
      }

      if (!isBoolean(willing)) {
        // if all passed are true, treat undefined as false
        if (useCount === passCount) {
          return
        }

        // treat undefined as false
        if (removeCount !== passCount) {
          return
        }

        // if all passed are false, treat undefined as true
      }

      let pattern = definition[key]
      next[key] = pattern
    })

    const schema = new Schema(next)
    return schema
  }

}

export default Schema
