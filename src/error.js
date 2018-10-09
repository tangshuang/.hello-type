import { inObject, stringify, isInstanceOf, inArray } from './utils'

export const messages = {
  'dict.arguments.length': '{keyPath} does not match {type}, length should be {ruleLength}, but receive {targetLength}.',
  'dict.object': '{keyPath} should be an object, which does not match {type}.',
  'enum': '{keyPath} does not match {should}({rules}).',
  'hello.define.target.object': 'argument should be an object',
  'hello.define.rule.object': '{rule} should be an object as a rule',
  'hello.define.property.object': '{prop} property should be an object, but receive {value}.',
  'list.arguments.length': '{keyPath} does not match {type}, length should be {length}, but receive {targetLength}.',
  'list.array': '{keyPath} does not match {type} which should be an array.',
  'range.arguments.length': '{keyPath} does not match {type}, length should be {length}, but receive {targetLength}.',
  'range.number': '{keyPath} should be a number for {type}, but receive {value}.',
  'range': '{keyPath} is {value} which does not match {type}({min}, {max}).',
  'rule.equal': '{keyPath} does not equal {should}.',
  'rule.instanceof': '{keyPath} is not an instance of {should}.',
  'rule.lambda.function': '{keyPath} should be a function, but receive {value}.',
  'rule.null': '{keyPath} should be null, but receive {value}.',
  'rule.undefined': '{keyPath} should be undefined, but receive {value}.',
  'tuple.arguments.length': '{keyPath} does not match {type}, length should be {ruleLength}, but receive {targetLength}.',
  'tuple.strict.arguments.length': '{keyPath} does not match {type} in strict mode, length should be {ruleLength}, but receive {targetLength}.',
  'type.arguments.length': '{keyPath} does not match {type}, length should be {ruleLength}, but receive {targetLength}.',
  'type.Array': '{keyPath} should be an Array, but receive {value}.',
  'type.Boolean': '{keyPath} should be a Boolean, but receive {value}.',
  'type.Function': '{keyPath} should be a Function, but receive {value}.',
  'type.NaN': '{keyPath} should be a NaN, but receive {value}.',
  'type.Number': '{keyPath} should be a Number, but receive {value}.',
  'type.Object': '{keyPath} should be a Object, but receive {value}.',
  'type.object.key.missing': '{keyPath} does not exists.',
  'type.regexp.string': '{keyPath} should be a string to match RegExp instance, but receive {value}.',
  'type.regexp': '{keyPath} does not match RegExp instance {should}, receive {value}.',
  'type.String': '{keyPath} should be a String, but receive {value}.',
  'type.Symbol': '{keyPath} should be a Symbol, but receive {value}.',
  'type.strict.array.length': 'array at {keyPath} whose length should be {ruleLength} in strict mode, but receive {targetLength}.',
  'type.strict.object.key.overflow': '{keyPath} should not exists, only {ruleKeys} allowed in strict mode.',
  'type': '{keyPath} does not match {type}, receive {value}.',
}
export function mError(key, params) {
  let message = messages[key] || key
  let text = message.replace(/\{(.*?)\}/g, (match, key) => inObject(key, params) ? key === 'stack' ? params[key] : stringify(params[key]) : match)
  return text
}
export function xError(error, params) {
  if (isInstanceOf(error, Error)) {
    let traces = error.traces ? error.traces : (error.traces = [])

    let keys = []
    traces.forEach(item => {
      if (inObject('key', item)) {
        keys.push(item.key)
      }
      if (inObject('index', item)) {
        let last = keys.pop() || ''
        keys.push(last + '[' + item.index + ']')
      }
    })
    let keyPath = keys.join('.')

    let e = new Error()
    let stack = e.stack || e.stacktrace
    let stacks = stack.split('\n')
    stacks.shift()
    stacks.shift()
    stacks.shift()
    stack = stacks.join('\n')

    let trace = Object.assign({ stack, keyPath }, params)
    traces.unshift(trace)

    return error
  }

  return null
}
export class HelloTypeError extends TypeError {
  constructor(key, params = {}) {
    super(key)
    Object.defineProperties(this, {
      key: {
        value: key,
      },
      traces: {
        value: [],
      },
      summary: {
        get() {
          let traces = this.traces
          let firstItem = traces[0]
          let lastItem = traces[traces.length - 1]
          let info = {}

          for (let i = traces.length - 1; i >= 0; i --) {
            let item = traces[i]
            Object.assign(info, item)
          }
          delete info.key

          let get = (rule) => {
            let totype = typeof(rule)
            if (inArray(totype, ['number', 'string', 'boolean', 'undefined']) || rule === null) {
              return rule
            }
            else {
              return rule.name
            }
          }
          let summary = {
            keyPath: firstItem.keyPath, // node keyPath
            value: get(lastItem.target), // received node value
            should: get(lastItem.rule), // node rule
            stack: lastItem.stack,
            rule: firstItem.rule,
            target: firstItem.target,
            type: firstItem.type,
          }
          Object.assign(info, summary)

          return info
        },
      },
      message: {
        get() {
          let info = this.summary
          let message = mError(key, info)
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
        value: function(message) {
          return mError(message, this.summary)
        }
      },
    })
    xError(this, params)
  }

  static get messages() {
    return messages
  }
}
