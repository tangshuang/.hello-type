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

export function inObject(key, obj) {
  return inArray(key, Object.keys(obj))
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

export function isInstanceOf(ins, cons) {
  return ins instanceof cons
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

export function decorate(factory, method = 'input') {
  return function(target, prop, descriptor) {
    // decorate class constructor function
    if (target && !prop) {
      return class extends target {
        constructor(...args) {
          if (isFunction(factory) && method !== 'input' && method !== 'output') {
            factory(...args)
          }
          super(...args)
        }
      }
    }
    // decorate class member
    else if (prop) {
      // change the property
      descriptor.set = (value) => {
        if (isFunction(factory) && method !== 'input' && method !== 'output') {
          factory(value)
        }
        descriptor.value = value
      }
      
      // method
      let property = descriptor.value
      if (typeof property === 'function') {
        let wrapper = function(...args) {
          if (isFunction(factory) && method === 'input') {
            factory(...args)
          }
          let result = property.call(this, ...args)
          if (isFunction(factory) && method === 'output') {
            factory(result)
          }
          return result
        }
        descriptor.value = wrapper
      }

      return descriptor
    }
    else {
      return descriptor
    }
  }
}

export function xError(error, info) {
  if (error instanceof Error) {
    let trace = Object.assign({ message: error.message }, info)
    error.trace = error.trace || []
    error.trace.shift(trace)
    return error
  }
  
  return null
}
