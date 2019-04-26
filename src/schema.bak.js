import Dict, { dict } from './dict.js'
import { isObject, isArray, isString, isNumber, inObject, isInstanceOf, sortBy, assign, parse, isNumeric, isEmpty, map } from './utils.js'
import Rule, { Any, Null, Undefined, Numeric, makeRule, ifexist, Int, Float } from './rule.js'
import { list } from './list.js'
import Type from './type.js'
import { enumerate } from './enum.js'
import Txpe from './txpe.js'

/**
 * 数据源相关信息
 * definition是一个对象
 *
 * {
 *   // 字段名
 *   key: {
 *     value: '', // 必填，默认值，普通数据类型 string|number|boolean
 *     type: String, // 可选，数据类型，修改值的时候，会触发校验
 *
 *     // 第一阶段：
 *     // 从后台api拿到数据后恢复数据相关
 *     prepare: data => !!data.on_market, // 可选，配合set方法使用
 *       // 在执行parse的时候，用一个数据去恢复模型数据，这个数据被当作prepare的参数data，prepare的返回值，将作为property的恢复后值使用
 *       // data就是parse接收的参数
 *
 *     // 第二阶段：
 *     // 或者将多个校验器放在一个数组里面，这样可以根据不同的校验规则提示不同的错误信息，
 *     // 当给了validators，其他的校验配置失效（determine会保留，并且在所有的determine前执行
 *     validators: [
 *       {
 *         // 校验相关的配置
 *         validate: (value) => Boolean, // 可选，校验器，可以引入validators下的校验器，快速使用校验器
 *         determine: (value) => Boolean, // 决定是否要执行这个校验器，如果返回false，则忽略该校验器的校验规则
 *         deferred: true, // 是否异步校验，异步校验时，在进程过程中直接跳过，在回调函数中执行校验结果
 *         message: '', // 可选，校验失败的时候的错误信息
 *         warn: (error) => {}, // 校验失败时的回调函数，error的message字段就是message的值
 *         order: 10, // 校验顺序，越小越靠前进行校验，默认值为10
 *       },
 *     ],
 *
 *     // 第三阶段：
 *     // 准备上传数据，格式化数据相关
 *     drop: (value) => Boolean, // 可选，是否要在调用.jsondata或.formdata的时候排除当前这个字段
 *     flat: (value) => ({ keyPath: value }), // 可选，在制作表单数据的时候，把原始值转换为新值赋值给model的keyPath。
 *       // value为map之前的值。
 *       // 在将一个字段展开为两个字段的时候会用到它。
 *       // 注意，使用了flat，如果想在结果中移除原始key，还需要使用drop。
 *       // 例如： flat: (region) => ({ 'company.region_id': region.region_id }) 会导致最后在构建表单的时候，会有一个company.region_id属性出现
 *       // flat的优先级更高，它会在drop之前运行，因此，drop对它没有影响，这也符合逻辑，flat之后，如果需要从原始数据中删除自身，需要设置drop
 *     map: (value) => newValue, // 可选，使用新值覆盖原始值输出，例如 map: region => region.region_id 使当前这个字段使用region.region_id作为最终结果输出。
 *       // 注意：它仅在drop为false的情况下生效，drop为true，map结果不会出现在结果中。
 *   }
 * }
 *
 * 需要注意：只有definition中规定的属性会被当作model最终生成formdata的字段，不在definition中规定的，但是仍然存在于model中的属性不会被加入到formdata中。
 * 当然，即使在definition中，但加了drop的也可能被排除出去。抑或，不在definition中，但flat和patch的新属性也会被加入到formdata结果中。
 *
 * 当一个属性的值为一个新的FormModel，或者为一个包含了FormModel的数组时，在生成最终的formdata的时候，会从这些FormModel中提取出真正的结果。
 */
export class Schema {
  constructor(pattern) {
    this.pattern = pattern
    this.name = 'Schema'
    this.data = {}
    this.txpe = new Txpe()

    this.__listeners = []
    this.__isBatchUpdating = null
    this.__batch = []

    this.init()
  }
  get(key) {
    return key ? this.data[key] : this.data
  }
  set(key, value, silent = false) {
    if (!this.pattern[key]) {
      throw new Error(`${key} not exist in schema.`)
    }

    this.assert(key, value)

    this.data[key] = value

    if (!silent) {
      this.dispatch(key, value)
    }

    return this
  }

  // 批量更新，异步动作，多次更新一个值，只会触发一次
  update(data) {
    const keys = Object.keys(data)
    keys.forEach((key) => {
      const value = data[key]
      this.__batch.push({ key, value })
    })

    // 异步更新和触发
    clearTimeout(this.__isBatchUpdating)
    this.__isBatchUpdating = setTimeout(() => {
      const updating = this.__batch
      this.__batch = []

      // 去除已经存在的
      const table = {}
      updating.forEach((item, i) => {
        table[item.key] = i
      })

      const indexes = Object.values(table)
      const items = indexes.map(i => updating[i])

      items.forEach(({ key, value }) => this.set(key, value))
    })

    return this
  }
  watch(key, fn, priority = 10) {
    // 数组，则一次性添加多个
    if (isArray(key)) {
      key.forEach((key) => this.watch(key, fn, priority))
      return this
    }

    this.__listeners.push({ key, fn, priority })
    return this
  }
  unwatch(key, fn) {
    // 数组，则一次性添加多个
    if (isArray(key)) {
      key.forEach((key) => this.unwatch(key, fn))
      return this
    }

    this.__listeners.forEach((item, i) => {
      if (item.key === key && (item.fn === undefined || item.fn === fn)) {
        this.__listeners.splice(i, 1)
      }
    })
    return this
  }
  dispatch(key, value) {
    const listeners = this.__listeners.filter(item => item.key === key)
    const watchers = sortBy(listeners, 'priority')
    watchers.forEach(({ fn }) => {
      fn.call(this, key, value)
    })

    return this
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
      throw new Error('need at least one parameter.')
    }

    // this.assert({ name: 'timy' })
    if (arguments.length === 1) {
      value = key
      key = undefined
      if (!isObject(value)) {
        throw new Error('value should be an object.')
      }
    }

    if (!isEmpty(key)) {
      if (!this.pattern[key]) {
        throw new Error(`${key} not exist in schema.`)
      }

      let currentPath = parentPath + (isNumber(key) || isNumeric(key) ? '[' + key + ']' : '.' + key)
      let type = this.pattern[key].type
      if (type === Schema) {
        type.assert(undefined, value, currentPath)
      }
      else {
        let error = this.txpe.catch(value).by(type)
        if (error) {
          throw new Error(`${currentPath} should be ${error.summary.should}.`)
        }
      }
    }
    else {
      const keys = Object.keys(this.pattern)
      for (let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i]
        let comming = value[key]
        this.assert(key, comming)
      }
    }
  }
  validate(key) {
    const pattern = this.pattern
    if (!key) {
      const keys = Object.keys(pattern)
      return this.validate(keys)
    }

    if (isArray(key)) {
      const keys = key
      for (let i = 0, len = keys.length; i < len; i ++) {
        const key = keys[i]
        const error = this.validate(key)
        if (error) {
          return error
        }
      }
      return null
    }

    if (!pattern[key]) {
      return new Error(`${key} not exist in schema.`)
    }

    const type = pattern[key].type
    const value = this.get(key)

    if (type === Schema) {
      type.assert(undefined, value, currentPath)
    }
    else {
      let error = this.txpe.catch(value).by(type)
      if (error) {
        throw new Error(`${currentPath} should be ${error.summary.should}.`)
      }
    }

    this.txpe.expect(value).to.be(type)
  }

  data() {}
  jsondata() {}
  formdata() {}
}

export default Schema
