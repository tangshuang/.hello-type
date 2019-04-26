import { dict } from './dict.js'
import { isObject, isArray, isNumber, inObject, isInstanceOf, sortBy, assign, parse, isNumeric, isEmpty, isFunction, isBoolean, flatObject } from './utils.js'
import Txpe from './txpe.js'

/**
 * 数据源相关信息
 * definition是一个对象
 *
 * {
 *   // 字段名
 *   key: {
 *     value: '', // 必填，默认值
 *     type: String, // 可选，数据类型，修改值的时候，会触发校验
 *
 *      // 或者将多个校验器放在一个数组里面，这样可以根据不同的校验规则提示不同的错误信息，
 *     // 当给了validators，其他的校验配置失效（determine会保留，并且在所有的determine前执行
 *     validators: [
 *       {
 *         // 校验相关的配置
 *         validate: (value) => Boolean, // 可选，校验器，可以引入validators下的校验器，快速使用校验器
 *         determine: (value) => Boolean, // 决定是否要执行这个校验器，如果返回false，则忽略该校验器的校验规则
 *         message: '', // 可选，校验失败的时候的错误信息
 *         order: 10, // 校验顺序，越小越靠前进行校验，默认值为10
 *       },
 *     ],
 *
 *     // 从后台api拿到数据后恢复数据相关
 *     prepare: data => !!data.on_market, // 可选，配合override方法使用
 *       // 在执行override的时候，用一个数据去恢复模型数据，这个数据被当作prepare的参数data，prepare的返回值，将作为property的恢复后值使用
 *       // data就是override接收的参数
 *
 *     // 准备上传数据，格式化数据相关
 *     flat: (value) => ({ keyPath: value }), // 可选，在制作表单数据的时候，把原始值转换为新值赋值给model的keyPath。
 *       // value为map之前的值。
 *       // 在将一个字段展开为两个字段的时候会用到它。
 *       // 注意，使用了flat，如果想在结果中移除原始key，还需要使用drop。
 *       // 例如： flat: (region) => ({ 'company.region_id': region.region_id }) 会导致最后在构建表单的时候，会有一个company.region_id属性出现
 *       // flat的优先级更高，它会在drop之前运行，因此，drop对它没有影响，这也符合逻辑，flat之后，如果需要从原始数据中删除自身，需要设置drop
 *     drop: (value) => Boolean, // 可选，是否要在调用.jsondata或.formdata的时候排除当前这个字段
 *     map: (value) => newValue, // 可选，使用新值覆盖原始值输出，例如 map: region => region.region_id 使当前这个字段使用region.region_id作为最终结果输出。
 *       // 注意：它仅在drop为false的情况下生效，drop为true，map结果不会出现在结果中。
 *   },
 * }
 *
 * 需要注意：只有definition中规定的属性会被当作model最终生成formdata的字段，不在definition中规定的，但是仍然存在于model中的属性不会被加入到formdata中。
 * 当然，即使在definition中，但加了drop的也可能被排除出去。抑或，不在definition中，但flat和patch的新属性也会被加入到formdata结果中。
 *
 * 当一个属性的值为一个新的FormModel，或者为一个包含了FormModel的数组时，在生成最终的formdata的时候，会从这些FormModel中提取出真正的结果。
 */
export class Schema {
  constructor(definition) {
    this.definition = definition
    this.name = 'Schema'
    this.state = {}
    this.txpe = new Txpe()
  }

  throw(error) {
    console.error(error)
  }

  get(key) {
    return key ? parse(this.state, key) : this.state
  }
  set(key, value) {
    if (!this.pattern[key]) {
      let error = new Error(`${key} not exist in schema.`)
      this.throw(error)
      return this
    }

    let error = this.assert(key, value)
    if (error) {
      this.throw(error)
      return this
    }

    assign(this.state, key, value)
    return this
  }

  // 批量更新，异步动作，多次更新一个值，只会触发一次
  update(data = {}) {
    const definition = this.definition
    const keys = Object.keys(data)
    keys.forEach((key) => {
      // 不存在定义里的字段不需要
      if (!inObject(key, definition)) {
        return
      }
      const value = data[key]
      this.__update.push({ key, value })
    })

    // 异步更新和触发
    return new Promise((resolve, reject) => {
      clearTimeout(this.__isUpdating)
      this.__isUpdating = setTimeout(() => {
        const updating = this.__update
        this.__update = []

        // 去除已经存在的
        const table = {}
        updating.forEach((item, i) => {
          table[item.key] = i
        })

        const indexes = Object.values(table)
        const items = indexes.map(i => updating[i])

        // 先进行数据检查
        for (let i = 0, len = items.length; i < len; i ++) {
          let item = items[i]
          let { key, value } = item
          let error = this.assert(key, value)
          if (error) {
            reject(error)
            return
          }
        }

        // 检查完数据再塞值
        items.forEach(({ key, value }) => assign(this.state, key, value))
        resolve()
      })
    })
  }

  // 用新数据覆盖原始数据，使用schema的prepare函数获得需要覆盖的数据
  // 如果一个数据不存在于新数据中，将使用默认值
  override(data) {
    return new Promise((resolve, reject) => {
      clearTimeout(this.__isOverriding)
      this.__isOverriding = setTimeout(() => {
        const definition = this.definition
        const keys = Object.keys(definition)
        const items = []
        keys.forEach((key) => {
          const def = definition[key]
          const { prepare, value } = def
          const val = prepare ? prepare(data) : value
          items.push({ key, value: val })
        })

        const updating = {}
        items.forEach(({ key, value }) => {
          updating[key] = value
        })

        this.update(updating).then(resolve).catch(reject)
      })
    })
  }

  type() {
    const types = {}
    const keys = Object.keys(this.pattern)
    keys.forEach((key) => {
      const item = this.pattern[key]
      var type = item.type
      if (isInstanceOf(type, Schema)) {
        type = type.type()
      }
      types[key] = type
    })
    return dict(types)
  }

  assert(key, value, parentPath = '') {
    if (arguments.length < 1) {
      let error = new Error('need at least one parameter.')
      this.throw(error)
      return error
    }

    // this.assert({ name: 'timy' })
    if (arguments.length === 1) {
      value = key
      key = undefined
      if (!isObject(value)) {
        let error = new Error('value should be an object.')
        this.throw(error)
        return error
      }
    }

    // key不为空
    if (!isEmpty(key)) {
      if (!this.pattern[key]) {
        let error = new Error(`${key} not exist in schema.`)
        this.throw(error)
        return error
      }

      let currentPath = parentPath + (isNumber(key) || isNumeric(key) ? '[' + key + ']' : '.' + key)
      let { type, validators } = this.pattern[key]

      // 类型检查
      let error = (type instanceof Schema) ? type.assert(undefined, value, currentPath) : this.txpe.catch(value).by(type)
      if (error) {
        let error = new Error(`${currentPath} should be ${error.summary.should}.`)
        this.throw(error)
        return error
      }

      // 校验器
      if (validators && isArray(validators)) {
        const items = sortBy(validators, 'order')
        for (let i = 0, len = items.length; i < len; i ++) {
          let item = items[i]
          let { validate, determine, message } = item
          if (isFunction(determine) && !determine.call(this, value)) {
            break
          }

          let bool = validate(value)
          if (!bool) {
            if (isFunction(message)) {
              message = message.call(this, value, currentPath)
            }
            let error = new Error(message || `${currentPath} did not pass validate.`)
            this.throw(error)
            return error
          }
        }
      }
    }
    // key为空，但传了value
    else {
      const keys = Object.keys(this.pattern)
      for (let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i]
        let comming = value[key]

        let error = this.assert(key, comming)
        if (error instanceof Error) {
          this.throw(error)
          return error
        }
      }
    }
  }

  validate(key) {
    const pattern = this.pattern

    // 校验整个值
    if (!key) {
      const keys = Object.keys(pattern)
      return this.validate(keys)
    }

    // 多个key组成的数组
    if (isArray(key)) {
      const keys = key
      for (let i = 0, len = keys.length; i < len; i ++) {
        const key = keys[i]
        const error = this.validate(key)
        if (error) {
          return error
        }
      }
    }

    // 单个key
    if (!pattern[key]) {
      return new Error(`${key} not exist in schema.`)
    }

    const { type } = pattern[key]
    const value = this.get(key)

    const error = (type instanceof Schema) ? type.assert(value) : this.txpe.catch(value).by(type)
    if (error) {
      return error
    }
  }

  /**
   * 获取数据，获取数据之前，一定要先校验一次，以防获取中报错
   * @param {*} mode
   * 1: 获取经过map之后的数据
   * 2: 在1的基础上获取扁平化数据
   * 3: 在2的基础上转化为FormData
   * 0: 获取原始数据
   */
  data(mode = 0) {
    if (mode === 1) {
      const data = this.state
      const definition = this.definition

      const extract = (data, definition) => {
        const keys = Object.keys(definition)
        const output = {}

        keys.forEach((key) => {
          const { drop, flat, map, type } = definition[key]
          const value = data[key]

          if (type instanceof Schema) {
            const v = extract(value, type.definition)
            assign(output, key, v)
            return
          }


          if (isFunction(flat)) {
            let mapping = flat.call(this, value)
            let mappingKeys = Object.keys(mapping)
            mappingKeys.forEach((key) => {
              let value = mapping[key]
              assign(output, key, value)
            })
          }

          if (isFunction(drop) && drop.call(this, value)) {
            return
          }
          else if (isBoolean(drop) && drop) {
            return
          }

          if (isFunction(map)) {
            let v = map.call(this, value)
            assign(output, key, v)
          }
        })

        return output
      }

      const output = extract(data, definition)
      return output
    }
    else if (mode === 2) {
      const data = this.data(1)
      const output = flatObject(data)
      return output
    }
    else if (mode === 3) {
      const data = this.data(2)
      const formdata = new FormData()
      const formkeys = Object.keys(data)

      formkeys.forEach((key) => {
        formdata.append(key, data[key])
      })

      return formdata
    }
    else {
      return this.state
    }
  }
}

export default Schema
