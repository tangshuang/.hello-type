export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isBoolean(value) {
  return value === true || value === false
}

export function isString(value) {
  return typeof value === 'string'
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function isSymbol(value) {
  return typeof value === 'symbol'
}

export function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object
}

export function isArray(value) {
  return Array.isArray(value)
}

export function inArray(value, arr) {
  return arr.indexOf(value) > -1
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

export function isConstructor(f) {
  let instance = null
  try {
    instance = new f()
  }
  catch (e) {
    if (e.message.indexOf('is not a constructor') > -1) {
      instance = null
      return false
    }
  }
  instance = null
  return true
}

export function toFlatObject(obj, parentPath = '', result = {}) {
  let keys = Object.keys(obj)
  keys.sort() // make sure the output are the same order
  keys.forEach((key) => {
    let path = parentPath ? parentPath + '.' + key : key
    let value = obj[key]
    if (isObject(value)) {
      toFlatObject(value, path, result)
    }
    else {
      result[path] = value
    }
  })
  return result
}

export function toShallowObject(obj, factory) {
  let result = {}
  let keys = Object.keys(obj)
  keys.sort() // make sure the output are the same order
  keys.forEach((key) => {
    let value = obj[key]
    result[key] = isFunction(factory) ? factory(value) || value : value
  })
  return result
}

export function decorate(factory) {
  return function(target, prop, descriptor) {
    // decorate class constructor function
    if (target && !prop) {
      return class extends target {
        constructor(...args) {
          isFunction(factory) && factory(...args)
          super(...args)
        }
      }
    }
    // decorate class member function
    else if (prop) {
      let property = descriptor.value
      if (typeof property === 'function') {
        let wrapper = function(...args) {
          isFunction(factory) && factory(...args)
          property.call(this, ...args)
        }
        descriptor.value = wrapper
      }
      else {
        descriptor.set = (value) => {
          isFunction(factory) && factory(value)
          descriptor.value = value
        }
      }
      return descriptor
    }
    else {
      return descriptor
    }
  }
}
