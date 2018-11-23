import { inObject, stringify, isInstanceOf, inArray, isArray, isObject, isFunction, isNaN } from './utils'

export const messages = {
  'dict.object': '{keyPath} does not match {rule}, it should be an object, but receive {value}.',
  'enum': '{keyPath} should match {should}, but receive {value}.',
  'hello.define.target.object': 'argument should be an object',
  'hello.define.rule.object': '{rule} should be an object as a rule',
  'hello.define.property.object': '{prop} property should be an object, but receive {value}.',
  'list.array': '{keyPath} does not match {rule}, it should be an array, receive {value}.',
  'range.number': '{keyPath} does not match {type}, should be a number, receive {value}.',
  'range': '{keyPath} does not match {type}({min}, {max}), receive {value}.',
  'rule.equal': '{keyPath} does not equal {should}.',
  'rule.instanceof': '{keyPath} is not an instance of {should}.',
  'rule.lambda.function': '{keyPath} should be a function, but receive {value}.',
  'rule.null': '{keyPath} should be null, but receive {value}.',
  'rule.undefined': '{keyPath} should be undefined, but receive {value}.',
  'tuple.arguments.length': '{keyPath} does not match {type}, length should be {ruleLength}, but receive {targetLength}.',
  'tuple.strict.arguments.length': '{keyPath} does not match {type} in strict mode, length should be {ruleLength}, but receive {targetLength}.',
  'type.arguments.length': '{keyPath} does not match {type}, length should be {ruleLength}, but receive {targetLength}.',
  'type.Array': '{keyPath} should be Array, but receive {value}.',
  'type.array.length': '{keyPath} should be array of length greater than {ruleLength}, but recieve length {targetLength}.',
  'type.Boolean': '{keyPath} should be Boolean, but receive {value}.',
  'type.Function': '{keyPath} should be Function, but receive {value}.',
  'type.NaN': '{keyPath} should be NaN, but receive {value}.',
  'type.Number': '{keyPath} should be Number, but receive {value}.',
  'type.Object': '{keyPath} should be Object, but receive {value}.',
  'type.object.key.missing': '{keyPath} does not exists.',
  'type.regexp.string': '{keyPath} should be a string to match RegExp instance, but receive {value}.',
  'type.regexp': '{keyPath} does not match RegExp instance {should}, receive {value}.',
  'type.String': '{keyPath} should be String, but receive {value}.',
  'type.Symbol': '{keyPath} should be Symbol, but receive {value}.',
  'type.strict.array.length': 'array at {keyPath} whose length should be {ruleLength} in strict mode, but receive {targetLength}.',
  'type.strict.object.key.overflow': '{keyPath} should not exists, only {ruleKeys} allowed in strict mode.',
  'type': '{keyPath} should match {should}, but receive {value}.',
}
export function mError(key, params) {
  let message = messages[key] || key
  let text = message.replace(/\{(.*?)\}/g, (match, key) => inObject(key, params) ? params[key] : match)
  return text
}
export function xError(error, params) {
  if (isInstanceOf(error, Error)) {
    let traces = error.traces ? error.traces : (error.traces = [])

    let keyPath = inObject('key', params) ? params.key : inObject('index', params) ? `[${params.index}]` : ''
    let currentPath = keyPath
    traces.forEach((item) => {
      if (inObject('key', item)) {
        currentPath = (currentPath ? currentPath + '.' : '') + item.key
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
    stacks.shift()
    stack = stacks.join('\n')

    let trace = Object.assign({}, params, { stack, keyPath })
    traces.unshift(trace)

    return error
  }

  return null
}
export class HelloTypeError extends TypeError {
  constructor(key, params = {}) {
    super(key)
    Object.defineProperties(this, {
      traces: {
        value: [],
      },
      summary: {
        get() {
          const traces = this.traces
          const info = traces[traces.length - 1] // use last trace which from the stack bottom as base info

          const shouldStringfy = value => typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'undefined' && value !== null && !isNaN(value)
          const getValue = (value) => {
            let totype = typeof(value)
            if (inArray(totype, ['number', 'boolean', 'undefined']) || value === null || isNaN(value)) {
              return shouldStringfy(value) ? stringify(value) : value
            }
            else if (totype === 'string') {
              return value.length > 16 ? value.substr(0, 16) + '...' : value
            }
            else if (isFunction(value)) {
              return `Function(${value.name}(){[code]})`
            }
            else if (isArray(value)) {
              return `Array(${value.map(item => isArray(item) ? 'Array' : getValue(item))})`
            }
            else if (isObject(value)) {
              let keys = Object.keys(value)
              return `Object({${keys.join(',')}})`
            }
            else {
              return value.name ? value.name : value.constructor ? value.constructor.name : value.toString()
            }
          }
          const getShould = (rule, type) => {
            let typeName = type.name

            let ruleValue = ''
            if (inArray(typeof(rule), ['number', 'boolean', 'undefined', 'string']) || rule === null || isNaN(rule) || isObject(rule) || isArray(rule) || isFunction(rule)) {
              ruleValue = getValue(rule)
            }
            else {
              ruleValue = rule.name ? rule.name : rule.constructor ? rule.constructor.name : rule.toString()
            }

            if (typeName === 'Type') {
              return ruleValue
            }
            else if (typeName === 'Enum' && isArray(rule)) {
              return 'Enum(' + rule.map(item => isArray(item) ? 'Array' : getValue(item)) + ')'
            }
            else if (typeName === 'List' && isArray(rule)) {
              return 'List([' + rule.map(item => isArray(item) ? 'Array' : getValue(item)) + '])'
            }
            else if (typeName === 'Dict' && isObject(rule)) {
              let keys = Object.keys(rule)
              return 'Dict({' + keys.join(',') + '})'
            }
            else {
              return typeName ? typeName + '(' + ruleValue + ')' : ruleValue
            }
          }

          let temp
          let researchPath = traces.map((item) => {
            let sep = temp === undefined ? '' : (item.keyPath === temp ? '^' : '/')
            temp = item.keyPath
            return sep + getShould(item.rule, item.type)
          })
          let summary = {
            value: getValue(info.target), // received node value
            should: getShould(info.rule, info.type), // node rule
            research: researchPath.join(''), // rule path
          }
          let res = Object.assign({}, info, summary)

          delete res.type
          delete res.rule

          return res
        },
      },
      message: {
        get() {
          let message = mError(key, this.summary)
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
          return mError(text, this.summary)
        }
      },
    })
    xError(this, params)
  }

  static get messages() {
    return messages
  }
}
