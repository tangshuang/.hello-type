import { inObject, stringify, isInstanceOf, inArray, isArray, isObject, isFunction, isNaN } from './utils'

export const messages = {
  'dict.object': '{keyPath} should match {should}, but receive {value}.',
  'enum': '{keyPath} should match {should}, but receive {value}.',
  'hello.define.target.object': 'argument should be an object',
  'hello.define.rule.object': '{rule} should be an object as a rule',
  'hello.define.property.object': '{prop} property should be an object, but receive {value}.',
  'list.array': '{keyPath} should match {should}, but receive {value}.',
  'range.number': '{keyPath} should match {should}, but receive {value}.',
  'range': '{keyPath} should match {should}, but receive {value}.',
  'rule.equal': '{keyPath} should match {should}, but receive {value}.',
  'rule.instanceof': '{keyPath} should match {should}, but receive {value}.',
  'rule.lambda.function': '{keyPath} should match {should}, but receive {value}.',
  'rule.null': '{keyPath} should match {should}, but receive {value}.',
  'rule.undefined': '{keyPath} should match {should}, but receive {value}.',
  'rule.numeric': '{keyPath} should match {should}, but receive {value}.',
  'tuple.arguments.length': '{keyPath} does not match {should}, length should be {ruleLength}, but receive {targetLength}.',
  'tuple.strict.arguments.length': '{keyPath} does not match {should} in strict mode, length should be {ruleLength}, but receive {targetLength}.',
  'type.arguments.length': '{keyPath} does not match {should}, length should be {ruleLength}, but receive {targetLength}.',
  'type.Array': '{keyPath} should match {should}, but receive {value}.',
  'type.array.length': '{keyPath} should be array of length greater than {ruleLength}, but recieve length {targetLength}.',
  'type.Boolean': '{keyPath} should match {should}, but receive {value}.',
  'type.Function': '{keyPath} should match {should}, but receive {value}.',
  'type.NaN': '{keyPath} should match {should}, but receive {value}.',
  'type.Number': '{keyPath} should match {should}, but receive {value}.',
  'type.Object': '{keyPath} should match {should}, but receive {value}.',
  'type.object.key.missing': '{keyPath} does not exists.',
  'type.regexp.string': '{keyPath} should be a string to match RegExp instance, but receive {value}.',
  'type.regexp': '{keyPath} does not match RegExp instance {should}, receive {value}.',
  'type.String': '{keyPath} should match {should}, but receive {value}.',
  'type.Symbol': '{keyPath} should match {should}, but receive {value}.',
  'type.strict.array.length': 'array at {keyPath} whose length should be {ruleLength} in strict mode, but receive {targetLength}.',
  'type.strict.object.key.overflow': '{keyPath} should not exists, only {ruleKeys} allowed in strict mode.',
  'type': '{keyPath} should match {should}, but receive {value}.',
}
export function mError(key, params) {
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

          const shouldStringfy = value => typeof value !== 'number' && typeof value !== 'boolean' && !isNaN(value)
          const getName = (value, masking = true) => {
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
              return `Array(${value.map(item => isArray(item) ? 'Array' : getName(item)).join(',')})`
            }
            else if (isObject(value)) {
              let keys = Object.keys(value)
              return `Object({${keys.join(',')}})`
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
          const getShould = (info) => {
            const { type, rule } = info
            const typeName = getName(type)

            // don't care rule any more
            if (!rule) {
              return typeName
            }

            const ruleValue = getName(rule, false)

            if (typeName === 'Type') {
              return ruleValue
            }
            else if (typeName === 'List') {
              return 'List([' + ruleValue + '])'
            }
            else {
              return typeName ? typeName + '(' + ruleValue + ')' : ruleValue
            }
          }

          let research = ''
          traces.forEach((item, i) => {
            let next = traces[i + 1]
            let keyPath = item.keyPath
            if (!next || (next.keyPath !== keyPath)) {
              research += (i > 0 ? '/' : '') + getShould(item)
            }
          })

          let summary = {
            value: getName(info.target), // received node value
            should: getShould(info), // node rule
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
