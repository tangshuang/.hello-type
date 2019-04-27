import { inObject, stringify, isInstanceOf, inArray, isArray, isObject, isFunction, isNaN } from './utils.js'

function makeErrorMessage(key, params) {
  let message = RtsmError.messages[key] || key
  let text = message.replace(/\{(.*?)\}/g, (match, key) => inObject(key, params) ? params[key] : match)
  return text
}

/**
 * add trace into an error
 * @param {*} error
 * @param {*} params the logic:
 * {
 *  target: passed value,
 *  type: current type name,
 *  rule: optional, if rule is passed, it means the type is a Functional type, i.e. Enum(String, Null) or IfExists(String), if it not passed, it means this type is a Stringal type.
 *  ... other props which may be needed
 * }
 */
export function makeError(error, params) {
  if (!isInstanceOf(error, Error)) {
    return null
  }

  let traces = error.traces ? error.traces : (error.traces = [])

  let keyPath = inObject('key', params) ? params.key : inObject('index', params) ? `[${params.index}]` : ''
  let currentPath = ''
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

export class RtsmError extends TypeError {
  constructor(key, params = {}) {
    super(key)
    Object.defineProperties(this, {
      traces: {
        value: [],
      },
      summary: {
        get() {
          const getReceive = (value, masking = false) => {
            let totype = typeof(value)
            if (inArray(totype, ['number', 'boolean', 'undefined']) || value === null || isNaN(value)) {
              return value
            }
            else if (totype === 'string') {
              let output = masking ? value.length > 16 ? value.substr(0, 16) + '...' : value : value
              return stringify(output)
            }
            else if (isFunction(value)) {
              return `Function:${value.name}()`
            }
            else if (isArray(value)) {
              let name = value.__name__ || 'Array'
              if (masking) {
                return `${name}(${value.length})`
              }
              else {
                return `${name}(${value.map(item => getReceive(item, true)).join(',')})`
              }
            }
            else if (isObject(value)) {
              let name = value.__name__ || 'Object'
              let keys = Object.keys(value)
              if (masking) {
                return `${name}({${keys.join(',')}})`
              }
              else {
                let values = []
                keys.forEach((key) => {
                  values.push(`${key}:` + getReceive(value[key], true))
                })
                return `${name}({${values.join(',')}})`
              }
            }
            else if (typeof value === 'object') { // for class instances
              return value.name ? value.name : value.constructor ? value.constructor.name : 'Object'
            }
            else if (typeof value === 'function') { // for native functions or classes
              return value.name ? value.name : value.constructor ? value.constructor.name : 'Function'
            }
            else {
              let output = value.toString()
              let res = masking ? output.length > 16 ? output.substr(0, 16) + '...' : output : output
              return res
            }
          }
          const getShould = (rule, type) => {
            if (!rule && !type) {
              return 'unknown'
            }

            let source = rule || type
            let name = getReceive(source)
            let should = name

            if (name === 'List' || name === 'Tuple') {
              let pattern = source.pattern.map(item => getShould(item))
              should = `${name}(${pattern.join(',')})`
            }
            else if (name === 'Dict') {
              let pattern = source.pattern
              let keys = Object.keys(pattern)
              should = `Dict({${keys.join(',')}})`
            }
            else if (inArray(name, ['Enum', 'Range'])) {
              let pattern = source.pattern.map(item => getShould(item))
              should = `${name}(${pattern.join(',')})`
            }
            else if (name === 'Type') {
              let pattern = source.pattern
              should = getShould(pattern)
            }
            else if (inArray(name, ['asynchronous', 'validate', 'match', 'ifexist', 'ifnotmatch', 'shouldexist', 'shouldnotexist', 'implement', 'equal', 'lambda'])) {
              let rule = source.arguments[0]
              let ruleName = getShould(rule)
              should = `${name}(${ruleName})`
            }

            return should
          }

          const traces = this.traces
          let info = traces[traces.length - 1] // use last trace which from the stack bottom as base info
          let research = ''

          let lastResearch = ''
          traces.forEach((item, i) => {
            let prev = traces[i - 1]
            let keyPath = item.keyPath
            let sep = ''
            let nextResearch = getShould(item.rule || item.type)

            if (prev && prev.keyPath !== keyPath) { // keyPath changed
              sep = '/'
            }
            else if (nextResearch !== lastResearch) {
              sep = ';'
            }
            research += i > 0 ? sep : ''

            if (prev && prev.keyPath !== keyPath && (item.key || item.index)) {
              research += (item.key || item.index) + ':'
            }

            if (nextResearch !== lastResearch) {
              research += nextResearch
            }

            lastResearch = nextResearch

            if (keyPath === info.keyPath) {
              info = Object.assign({}, info, item)
            }
          })

          let summary = {
            value: info.value,
            receive: getReceive(info.value, true), // received node value
            should: getShould(info.rule, info.type), // node rule
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
          makeError(this, params)
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
    makeError(this, params)
  }
}

RtsmError.messages = {
  mistaken: '{keyPath} should match {should}, but receive {receive}.',
  unexcepted: '{keyPath} should not match {should}, but receive {receive}.',
  dirty: '{keyPath} does not match {should}, length should be {length}.',
  overflow: '{keyPath} should not exists.',
  missing: '{keyPath} is missing.',
}

export default RtsmError
