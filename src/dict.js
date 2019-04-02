import Type from './type'
import { isObject, inArray, isBoolean } from './utils'
import { _ERROR_, xError } from './error'

const prototypes = {
  assert: function(value) {
    if (!isObject(value)) {
      throw new _ERROR_('refuse', { value, type: this, action: 'assert' })
    }

    let rule = this.rules[0]
    let error = this.validate(value, rule)
    if (error) {
      throw xError(error, { value, rule, type: this, action: 'assert' })
    }
  },
  extends: function(pattern) {
    const originalPattern = this.patterns[0]
    const newPattern = Object.assign({}, originalPattern, pattern)
    const newType = Dict(newPattern)
    return newType
  },
  extract: function(pattern) {
    const originalPattern = this.patterns[0]
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
  },
}

export function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    pattern = Object
  }

  const DictType = new Type(pattern)
  DictType.name = 'Dict'
  Object.assign(DictType, prototypes)

  return DictType
}
export default Dict
