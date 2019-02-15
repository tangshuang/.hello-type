import { inObject, stringify, isInstanceOf, inArray, isArray, isObject, isFunction, isNaN } from './utils'

export const messages = {
  refuse: '{keyPath} should match {should}, but receive {value}.',
  dirty: '{keyPath} does not match {should}, length should be {length}.',
  overflow: '{keyPath} should not exists, only {keys} allowed.',
  missing: '{keyPath} does not exists.'
}

function makeErrorMessage(key, params) {
  let message = messages[key] || key
  let text = message.replace(/\{(.*?)\}/g, (match, key) => inObject(key, params) ? params[key] : match)
  return text
}

/**
 *
 * @param {*} error
 * @param {*} params the logic:
 * {
 *  target: passed value,
 *  type: current type name,
 *  rule: optional, if rule is passed, it means the type is a Functional type, i.e. Enum(String, Null) or IfExists(String), if it not passed, it means this type is a Stringal type.
 *  ... other props which may be needed
 * }
 */
export function xError(error, params) {
  if (isInstanceOf(error, Error)) {
    let traces = error.traces ? error.traces : (error.traces = [])

    let keyPath = inObject('key', params) ? params.key : inObject('index', params) ? `[${params.index}]` : ''
    let currentPath = '#'
    traces.forEach((item) => {
      if (inObject('key', item)) {
        currentPath = currentPath + '.' + item.key
      }
      if (inObject('index', item)) {
        currentPath = currentPath + '[' + item.index + ']'
      }
      item.keyPath = currentPath
    })

    let e = new Error()
    let stack = e.stack || e.stacktrace
    let stacks = stack.split('\n')
    stacks.shift()
    stacks.shift()
    stack = stacks.join('\n')

    let trace = Object.assign({}, params, { stack, keyPath })
    traces.unshift(trace)

    return error
  }

  return null
}

export class _ERROR_ extends TypeError {
  constructor(key, params = {}) {
    super(key)
    Object.defineProperties(this, {
      traces: {
        value: [],
      },
      summary: {
        get() {
          const shouldStringfy = value => typeof value !== 'number' && typeof value !== 'boolean' && !isNaN(value)
          const getName = (value, masking = false) => {
            let totype = typeof(value)
            if (inArray(totype, ['number', 'boolean']) || value === null || isNaN(value)) {
              return shouldStringfy(value) ? stringify(value) : value
            }
            else if (totype === 'undefined') {
              return 'undefined'
            }
            else if (totype === 'string') {
              if (masking) {
                return value.length > 16 ? stringify(value.substr(0, 16) + '...') : stringify(value)
              }
              else {
                return stringify(value)
              }
            }
            else if (isFunction(value)) {
              return `Function:${value.name}()`
            }
            else if (isArray(value)) {
              if (masking) {
                return `Array(${value.length})`
              }
              else {
                return `Array(${value.map(item => isArray(item) ? 'Array' : getName(item)).join(',')})`
              }
            }
            else if (isObject(value)) {
              let keys = Object.keys(value)
              if (masking) {
                return `Object({${keys.join(',')}})`
              }
              else {
                let values = []
                keys.forEach((key) => {
                  values.push(`${key}:` + getName(value[key]))
                })
                return `Object({${values.join(',')}})`
              }
            }
            else if (typeof value === 'object') {
              return value.name ? value.name : value.constructor ? value.constructor.name : value.toString()
            }
            else if (typeof value === 'function') { // for native function or class
              return value.name
            }
            else {
              return value.toString()
            }
          }
          const getShould = (type) => {
            if (!type) {
              return 'unknown'
            }

            let name = getName(type)
            let should = name

            if (name === 'List') {
              let rules = type.rules[0].map(item => getShould(item))
              should = `List([${rules.join(',')}])`
            }
            else if (name === 'Dict') {
              let rules = type.rules[0]
              let keys = Object.keys(rules)
              should = `Dict({${keys.join(',')}})`
            }
            else if (inArray(name, ['Enum', 'Tuple', 'Range', 'Type'])) {
              let rules = type.rules.map(item => getShould(item))
              should = `${name}(${rules.join(',')})`
            }
            else if (inArray(name, ['IfExists', 'IfNotMatch', 'IfExistsNotMatch', 'ShouldMatch', 'Equal', 'InstanceOf', 'Validate', 'Determine'])) {
              let rule = type.arguments[0]
              let ruleName = getShould(rule)
              should = `${name}(${ruleName})`
            }

            return should
          }

          const traces = this.traces
          let info = traces[traces.length - 1] // use last trace which from the stack bottom as base info
          let research = ''

          traces.forEach((item, i) => {
            let next = traces[i + 1]
            let keyPath = item.keyPath
            let sep = ''

            if (next && next.keyPath !== keyPath) { // keyPath changed
              sep = '/'
            }
            else {
              sep = '.'
            }

            research += (i > 0 ? sep : '') + getShould(item)

            if (keyPath === info.keyPath) {
              info = Object.assign({}, info, item)
            }
          })

          let summary = {
            value: getName(info.value, true), // received node value
            should: getShould(info.rule || info.type), // node rule
            research,
          }
          let res = Object.assign({}, info, summary)

          delete res.type
          delete res.rule

          return res
        },
      },
      message_key: {
        value: key,
      },
      message: {
        get() {
          let message = makeErrorMessage(key, this.summary)
          return message
        },
      },
      addtrace: {
        value: function(params) {
          xError(this, params)
          return this
        },
      },
      translate: {
        value: function(text, replace) {
          if (replace) {
            // after this, error.message will get new text
            key = text
          }
          return makeErrorMessage(text, this.summary)
        }
      },
    })
    xError(this, params)
  }

  static get messages() {
    return messages
  }
}
