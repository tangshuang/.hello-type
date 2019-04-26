import Dict from './dict.js'
import { isObject, isArray, isString, isNumber, inObject, isInstanceOf } from './utils.js'
import Rule, { Any, Null, Undefined, Numeric, makeRule, ifexist, Int, Float } from './rule.js';
import { list } from './list.js';
import Type from './type.js';
import { enumerate } from './enum.js';

const SCHEMAS = {
  number: Number,
  string: String,
  boolean: Boolean,
  symbol: Symbol,
  null: Null,
  undefined: Undefined,

  function: Function,
  array: Array,
  object: Object,
  regexp: RegExp,
  any: Any,

  numeric: Numeric,
  int: Int,
  float: Float,
}

/**
 * 基于简单的Schema语法去定义类型
 * @example
 * const Child = new Schema({
 *   name: 'string',
 *   age: '?int',
 * })
 * Schema.define('Child', Child)
 *
 * const schema = new Schema({
 *   name: 'string',
 *   age: '?int', // ?表示可选的，置于语法开头
 *   books: 'string[]', // []表示这是一个数组
 *   neighbor: '?number|null', // |表示其中之一，这里表示neighbor字段可以是number也可以是null
 *   dogs: ['kily', 'ximen'], // 表示一个枚举值，只能从这中间选一个
 *   children: 'Child[]', // 使用前面定义的Child
 *   body: { // 直接表示body是一个对象，并且对对象内部结果进行规定
 *     head: 'boolean',
 *     feet: 'boolean',
 *   },
 * })

 *
 * // 因为Schema是基于Dict扩展的，因此，它其实拥有Dict的所有方法
 */
export class Schema extends Dict {
  constructor(pattern) {
    super(pattern)
    this.name = 'Schema'
    this.definition = { ...SCHEMAS }
    this.make()
  }

  define(name, definition) {
    this.definition[name] = definition
    this.make()
  }

  make() {
    const pattern = this.pattern
    const make = (pattern) => {
      const reuslts = {}
      const keys = Object.keys(pattern)
      keys.forEach((key) => {
        const value = pattern[key]
        if (isObject(value)) {
          value = make(value)
          value = dict(value)
        }
        else if (isArray(value)) {
          value = value.map(item => isObject(item) ? make(pattern) : this.parse(item))
          value = enumerate(value)
        }
        else {
          value = this.parse(value) // should be a rule
        }
        reuslts[key] = value
      })
    }
    const results = make(pattern)

    this.schema = results
  }

  parse(exp) {
    if (!isString(exp)) {
      return 'any'
    }

    // const split = (exp) => {
    //   let strarr = exp.split('')
    //   let segments = []

    //   let word = ''
    //   let complete = () => {
    //     if (!word) {
    //       return
    //     }
    //     if (word.substr(-2) === '[]') {
    //       segments.push({
    //         type: 'lexicality',
    //         symbol: '[]',
    //         schema: word.substring(0, word.length - 2),
    //       })
    //     }
    //     else {
    //       segments.push({
    //         type: 'schema',
    //         schema: word,
    //       })
    //     }
    //     word = ''
    //   }
    //   strarr.forEach((item, i) => {
    //     if (item === '?' && i === 0) {
    //       segments.push({
    //         type: 'grammar',
    //         symbol: '?',
    //       })
    //     }
    //     else if (item === '|') {
    //       complete()
    //       segments.push({
    //         type: 'syntax',
    //         symbol: item,
    //       })
    //     }
    //     else {
    //       word += item
    //     }
    //     if (i === strarr.length - 1 && word) {
    //       complete()
    //     }
    //   })
    //   return segments
    // }
    // const segments = split(exp)


    var needIfExist = false

    if (exp.indexOf('?') === 0) {
      needIfExist = true
      exp = exp.substring(1)
    }

    const schema = this.definition
    const segments = exp.split('|')
    const rules = segments.map((item) => {
      if (item.substr(-2) === '[]') {
        let name = item.substring(0, item.length - 2)
        if (!inObject(name, schema)) {
          return
        }
        let rule = schema[name]
        let type = list(rule)
        return type
      }
      else {
        if (!inObject(item, schema)) {
          return
        }
        let rule = schema[item]
        let type = isInstanceOf(rule, Rule) || isInstanceOf(rule, Type) ? rule : new Type(rule)
        return type
      }
    }).filter(item => !!item)

    var type = rules.length > 1 ? enumerate(...rules) : rules[0]
    if (needIfExist) {
      type = ifexist(type)
    }

    return type
  }

  assert(value) {
    if (!isObject(value)) {
      throw new TxpeError('shouldmatch', { value, type: this, level: 'assert' })
    }

    let rule = this.schema
    let error = this.validate(value, rule)
    if (error) {
      throw xError(error, { value, rule, type: this, level: 'assert' })
    }
  }

  /**
   * 修改全局的SCHEMAS，会影响所有的Schema实例，因此，必须在所有实例初始化之前行动
   * @param {*} name
   * @param {*} definition
   */
  static define(name, definition) {
    SCHEMAS[name] = definition
  }
}

export function schema(pattern) {
  const type = new Schema(pattern)
  return type
}

export default Schema
