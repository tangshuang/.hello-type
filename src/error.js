import { inObject, stringify, isInstanceOf } from './utils'

export const messages = {
  'dict.arguments.length': '(...{target}) does not match {type}, arguments length should be {ruleLength}.',
  'dict.object': '{target} which should be an object does not match {type}.',
  'enum': '{target} does not match {type}({rules}).',
  'hello.define.target.object': '{target} should be an object as an argument',
  'hello.define.rule.object': '{rule} should be an object as a rule',
  'hello.define.property.object': '{prop} property should be an object, but receive {value}.',
  'list.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'list.array': '{target} which should be an array does not match {type}.',
  'range.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'range.number': '{target} is not a number for {type}.',
  'range': '{target} does not match {type}({min}, {max}).',
  'rule.equal': '{target} does not equal {rule}.',
  'rule.instanceof': '{target} is not an instance of {rule}.',
  'rule.lambda.function': '{target} should be a function.',
  'rule.null': '{target} should be null.',
  'rule.undefined': '{target} should be undefined.',
  'tuple.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'tuple.strict.arguments.length': '(...{target}) does not match {type}  in strict mode, arguments length should be {length}.',
  'type.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'type.Array': '{target} does not match Array.',
  'type.Boolean': '{target} does not match Boolean.',
  'type.Function': '{target} does not match Function.',
  'type.NaN': '{target} does not match NaN.',
  'type.Number': '{target} does not match Number.',
  'type.Object': '{target} does not match Object.',
  'type.object.key.missing': '{keyPath} is not in {target}',
  'type.regexp.string': '{target} is not a string which does not match RegExp instance.',
  'type.regexp': '{target} does not match RegExp instance.',
  'type.String': '{target} does not match String.',
  'type.Symbol': '{target} does not match Symbol.',
  'type.strict.array.length': 'array length should be {ruleLength} in strict mode, but receive {targetLength}.',
  'type.strict.object.key.overflow': '{keyPath} should not be in {target}, only {ruleKeys} allowed in strict mode.',
  'type': '{target} does not match type.',
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
      traces: {
        value: [],
      },
      summary: {
        get() {
          let traces = this.traces
          let firstItem = traces[0]
          let lastItem = traces[traces.length - 1]
          let keyPath = firstItem.keyPath
          let stack = lastItem.stack
          let info = {}
          for (let i = traces.length - 1; i >= 0; i --) {
            let item = traces[i]
            Object.assign(info, item)
          }
          Object.assign(info, { keyPath, stack })
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
