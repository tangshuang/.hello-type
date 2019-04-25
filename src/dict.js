import Type from './type.js'
import { isObject, isBoolean } from './utils.js'
import { TxpeError, xError } from './error.js'

export class Dict extends Type {
  constructor(pattern) {
    // if pattern is not an object, it treated undefined
    if (!isObject(pattern)) {
      pattern = {}
    }

    super(pattern)
    this.name = 'Dict'
    this.pattern = pattern
  }
  assert(value) {
    if (!isObject(value)) {
      throw new TxpeError('shouldmatch', { value, type: this, level: 'assert' })
    }

    let rule = this.rules[0]
    let error = this.validate(value, rule)
    if (error) {
      throw xError(error, { value, rule, type: this, level: 'assert' })
    }
  }
  extends(pattern) {
    const originalPattern = this.pattern
    const newPattern = Object.assign({}, originalPattern, pattern)
    const newType = Dict(newPattern)
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

    const newType = Dict(newPattern)
    return newType
  }
}

export function dict(pattern) {
  const type = new Dict(pattern)
  return type
}

export default Dict
