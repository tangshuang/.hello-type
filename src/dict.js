import Type from './type.js'
import { isObject, isBoolean, isInstanceOf } from './utils.js'
import TsError, { makeError } from './error.js'

export class Dict extends Type {
  constructor(pattern) {
    if (!isObject(pattern)) {
      throw new Error('Dict pattern should be an object.')
    }

    super(pattern)
    this.name = 'Dict'
  }

  validate(value, pattern) {
    const info = { value, pattern, type: this, level: 'type', action: 'validate' }

    if (!isObject(value)) {
      return new TsError('mistaken', info)
    }

    const patterns = pattern
    const target = value
    const patternKeys = Object.keys(patterns)
    const targetKeys = Object.keys(target)

    // in strict mode, keys should absolutely equal
    if (this.mode === 'strict') {
      // properties should be absolutely same
      for (let i = 0, len = targetKeys.length; i < len; i ++) {
        let key = targetKeys[i]
        // target has key beyond rules
        if (!inArray(key, patternKeys)) {
          return new TsError('overflow', { ...info, key })
        }
      }
    }

    for (let i = 0, len = patternKeys.length; i < len; i ++) {
      let key = patternKeys[i]
      let pattern = patterns[key]
      let value = target[key]

      // not found some key in target
      // i.e. should be { name: String, age: Number } but give { name: 'tomy' }, 'age' is missing
      if (!inArray(key, targetKeys)) {
        if (isInstanceOf(pattern, Rule) && this.mode !== 'strict') {
          let error = pattern.validate2(value, key, target)
          if (!error) {
            continue
          }
        }
        return new TsError('missing', { ...info, key })
      }

      // rule validate2
      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate2(value, key, target)
        if (error) {
          return makeError(error, { ...info, key, value, pattern })
        }
        else {
          continue
        }
      }

      // normal validate
      let error = super.validate(value, pattern)
      if (error) {
        return makeError(error, { ...info, key, value, pattern })
      }
    }

    return null
  }

  extend(pattern) {
    const current = this.pattern
    const next = Object.assign({}, current, pattern)
    const type = new Dict(next)
    return type
  }
  extract(pattern) {
    const current = this.pattern
    const keys = Object.keys(pattern)
    const next = {}

    keys.forEach((key) => {
      if (pattern[key] === true) {
        next[key] = current[key]
      }
    })

    const type = new Dict(next)
    return type
  }
  mix(pattern) {
    const current = this.pattern
    const keys = Object.keys(pattern)
    const next = {}

    keys.forEach((key) => {
      if (pattern[key] === true) {
        next[key] = current[key]
      }
      else if (isObject(pattern[key])) {
        next[key] = pattern[key]
      }
    })

    const type = new Dict(next)
    return type
  }
}

export function dict(pattern) {
  const type = new Dict(pattern)
  return type
}

export default Dict
