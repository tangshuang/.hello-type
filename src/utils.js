export function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object
}

export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isBoolean(value) {
  return value === true || value === false
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

export function isConstructor(f) {
  try {
    new f()
  } 
  catch (err) {
    if (err.message.indexOf('is not a constructor') >= 0) {
      return false
    }
  }
  return true
}