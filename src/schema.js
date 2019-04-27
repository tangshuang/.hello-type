import { dict } from './dict.js'
import { isObject, isArray, isNumber, isInstanceOf, sortBy, isNumeric, isEmpty, isFunction, clone } from './utils.js'
import Ts from './ts.js'
import Type from './type.js';
import TsError from './error.js';

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
   * @param {*} [key]
   */
  type(key) {
    const definition = this.definition
    if (key) {
      if (!definition[key]) {
        this.throw(new TsError(`${key} not exist in schema.`))
        return
      }

      const pattern = definition[key]
      let type = pattern.type

      if (isInstanceOf(type, Schema)) {
        type = type.type()
      }
      else if (isArray(type)) {
        type = type.map(item => isInstanceOf(item, Schema) ? item.type() : item)
        type = list(...type)
      }
      else if (isObject(type)) {
        type = dict(type)
      }
      else if (!isInstanceOf(type, Type)) {
        type = new Type(type)
      }

      return type
    }

    const keys = Object.keys(definition)
    const type = {}
    keys.forEach((key) => {
      const t = this.type(key)
      type[key] = t
    })

    return dict(type)
  }

  /**
   * 断言给的值是否符合 schema 的要求
   * @param {*} [key]
   * @param {*} value
   */
  validate(key, value, _parentPath = '') {
    if (arguments.length < 1) {
      let error = new TsError(`schema validate need at least one parameter.`)
      this.throw(error)
      return error
    }

    if (arguments.length === 1) {
      value = key
      key = undefined
      if (!isObject(value)) {
        let error = new TsError(`schema validate value should be an object.`)
        this.throw(error)
        return error
      }
    }

    const definition = this.definition
    const currentPath = _parentPath + (isNumber(key) || isNumeric(key) ? '[' + key + ']' : '.' + key)

    // key不为空
    if (!isEmpty(key)) {
      if (!definition[key]) {
        let error = new TsError(`${currentPath} not exist in schema.`)
        this.throw(error)
        return error
      }

      let { type } = definition[key]

      // 类型检查
      let error = (type instanceof Schema) ? type.validate(undefined, value, currentPath) : Ts.catch(value).by(type)
      if (error) {
        let error = new TsError(`${currentPath} should be ${error.summary.should}.`)
        this.throw(error)
        return error
      }
    }
    // key为空，但传了value
    else {
      const keys = Object.keys(definition)
      for (let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i]
        let comming = value[key]

        let error = this.validate(key, comming)
        if (erro) {
          return error
        }
      }
    }
  }

  /**
   * 通过传入的数据定制符合 schema 的输出数据
   * @param {*} input
   */
  formulate(input, _parentPath = '') {
    const definition = this.definition
    const keys = Object.keys(definition)
    const output = {}

    keys.forEach((key) => {
      const pattern = definition[key]
      const { type, flat, drop, map } = pattern
      const defaultValue = pattern.default
      const value = input[key]
      const currentPath = _parentPath + (isNumber(key) || isNumeric(key) ? '[' + key + ']' : '.' + key)

      let data = null

      if (isInstanceOf(type, Schema)) {
        data = type.formulate(value, currentPath)
      }
      else {
        let error = this.validate(key, value, _parentPath)
        if (error) {
          this.throw(error)
          data = clone(defaultValue)
        }
        else {
          data = clone(value)
        }
      }

      if (isFunction(flat)) {
        let mapping = flat.call(this, data)
        let mappingKeys = Object.keys(mapping)
        mappingKeys.forEach((key) => {
          let value = mapping[key]
          assign(output, key, value)
        })
      }

      if (isFunction(drop) && drop.call(this, data)) {
        return
      }
      else if (isBoolean(drop) && drop) {
        return
      }

      if (isFunction(map)) {
        data = map.call(this, data)
      }

      output[key] = data
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
