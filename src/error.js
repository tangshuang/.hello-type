import { inObject, stringify, isInstanceOf } from './utils'

export const messages = {
  'dict.arguments.length': '(...{target}) does not match {type}, arguments length should be {ruleLength}.',
  'dict.object': '{keyPath} of {target} which should be an object does not match {type}.',
  'enum': '{keyPath} of {target} does not match {type}({rules}).',
  'hello.define.target.object': '{target} should be an object as an argument',
  'hello.define.rule.object': '{rule} should be an object as a rule',
  'hello.define.property.object': '{prop} property should be an object, but receive {value}.',
  'list.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'list.array': '{keyPath} of {target} which should be an array does not match {type}.',
  'range.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'range.number': '{keyPath} of {target} is not a number for {type}.',
  'range': '{keyPath} of {target} does not match {type}({min}, {max}).',
  'rule.equal': '{keyPath} of {target} does not equal {rule}.',
  'rule.instanceof': '{keyPath} of {target} is not an instance of {rule}.',
  'rule.lambda.function': '{keyPath} of {target} should be a function.',
  'rule.null': '{keyPath} of {target} should be null.',
  'rule.undefined': '{keyPath} of {target} should be undefined.',
  'tuple.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'tuple.strict.arguments.length': '(...{target}) does not match {type}  in strict mode, arguments length should be {length}.',
  'type.arguments.length': '(...{target}) does not match {type}, arguments length should be {length}.',
  'type.Array': '{keyPath} of {target} does not match Array.',
  'type.Boolean': '{keyPath} of {target} does not match Boolean.',
  'type.Function': '{keyPath} of {target} does not match Function.',
  'type.NaN': '{keyPath} of {target} does not match NaN.',
  'type.Number': '{keyPath} of {target} does not match Number.',
  'type.Object': '{keyPath} of {target} does not match Object.',
  'type.object.key.missing': '{keyPath} is not in {target}',
  'type.regexp.string': '{keyPath} of {target} is not a string which does not match RegExp instance.',
  'type.regexp': '{keyPath} of {target} does not match RegExp instance.',
  'type.String': '{keyPath} of {target} does not match String.',
  'type.Symbol': '{keyPath} of {target} does not match Symbol.',
  'type.strict.array.length': 'array at {keyPath} whose length should be {ruleLength} in strict mode, but receive {targetLength}.',
  'type.strict.object.key.overflow': '{keyPath} should not be in {target}, only {ruleKeys} allowed in strict mode.',
  'type': '{keyPath} of {target} does not match {type}.',
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
