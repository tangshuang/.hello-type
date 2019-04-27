import Type from './type.js'
import { isObject, isBoolean, isInstanceOf } from './utils.js'
import RtsmError, { makeError } from './error.js'

export class Dict extends Type {
  constructor(pattern) {
    if (!isObject(pattern)) {
      throw new Error('Dict pattern should be an object.')
    }

    super(pattern)
    this.name = 'Dict'
  }
  validate(value, pattern) {
    if (!isObject(value)) {
      return new RtsmError('mistaken', { value, pattern, type: this, level: 'validate' })
    }

    const patternKeys = Object.keys(pattern)
    const targetKeys = Object.keys(value)

    if (this.mode === 'strict') {
      // properties should be absolutely same
      for (let i = 0, len = targetKeys.length; i < len; i ++) {
        let key = targetKeys[i]
        // target has key beyond rules
        if (!inArray(key, patternKeys)) {
          return new RtsmError('overflow', { value, pattern, type: this, level: 'validate', key, keys: patternKeys })
        }
      }
    }

    const patterns = pattern
    const target = value

    for (let i = 0, len = patternKeys.length; i < len; i ++) {
      let key = patternKeys[i]
      let pattern = patterns[key]
      let value = target[key]

      // not found some key in target
      // i.e. should be { name: String, age: Number } but give { name: 'tomy' }, 'age' is missing
      if (!inArray(key, targetKeys)) {
        if (isInstanceOf(pattern, Rule) && this.mode !== 'strict') {
          let error = pattern.validate(value)

          // use pattern to override property when not exists
          // override value and check again
          if (isFunction(pattern.override)) {
            value = pattern.override(error, key, target)
            value = target[key]
            error = pattern.validate(value)
          }

          if (!error) {
            continue
          }
        }

        return new RtsmError('missing', { value, pattern, type: this, level: 'validate', key })
      }

      if (isInstanceOf(pattern, Rule)) {
        let error = pattern.validate(value)

        // use pattern to override property when not match
        // override value and check again
        if (isFunction(pattern.override)) {
          value = pattern.override(error, key, target)
          value = target[key]
          error = pattern.validate(value)
        }

        if (error) {
          return makeError(error, { value, pattern, type: this, level: 'validate', key })
        }
        else {
          continue
        }
      }

      // normal validate
      let error = super.validate(value, pattern)
      if (error) {
        return makeError(error, { value, pattern, type: this, level: 'validate', key })
      }
    }

    return null
  }
  assert(value) {
    const pattern = this.pattern
    const info = { value, pattern, type: this, level: 'assert' }

    if (!isObject(value)) {
      throw new RtsmError('mistaken', info)
    }

    const error = this.validate(value, pattern)
    if (error) {
      throw makeError(error, info)
    }
  }

  extends(pattern) {
    const originalPattern = this.pattern
    const newPattern = Object.assign({}, originalPattern, pattern)
    const newType = new Dict(newPattern)
    return newType
  }
  extract(pattern) {
    const originalPattern = this.pattern
    const originalKeys = Object.keys(originalPattern)
    const newPattern = {}

    const useKeys = []
    const removeKeys = []
    const passKeys = Object.keys(pattern)
    passKeys.forEach((key) => {
      let value = pattern[key]
      if (value === true) {
        useKeys.push(key)
      }
      else if (value === false) {
        removeKeys.push(key)
      }
    })
    const passCount = passKeys.length
    const removeCount = removeKeys.length
    const useCount = useKeys.length
    originalKeys.forEach((key) => {
      const whether = pattern[key]

      if (whether === false) {
        return
      }

      if (!isBoolean(whether)) {
        // if all passed are true, treat undefined as false
        if (useCount === passCount) {
          return
        }

        // treat undefined as false
        if (removeCount !== passCount) {
          return
        }

        // if all passed are false, treat undefined as true
      }

      let value = originalPattern[key]
      newPattern[key] = value
    })

    const newType = new Dict(newPattern)
    return newType
  }
}

export function dict(pattern) {
  const type = new Dict(pattern)
  return type
}

export default Dict
