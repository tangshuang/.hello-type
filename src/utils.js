export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isNumeric(value) {
  return isNumber(value) || (isString(value) && /^\-?[0-9]+(\.{0,1}[0-9]+){0,1}$/.test(value))
}

export function isBoolean(value) {
  return value === true || value === false
}

export function isString(value) {
  return typeof value === 'string'
}

export function isFunction(value) {
  return typeof value === 'function'
    && (value + '') !== `function ${value.name}() { [native code] }`
    && (value + '').indexOf('class ') !== 0
    && (value + '').indexOf('_classCallCheck(this,') === -1 // for babel transfered class
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

export function isNull(value) {
  return value === null
}

export function isUndefined(value) {
  return value === undefined
}

export function isNaN(value) {
  return typeof value === 'number' && Number.isNaN(value)
}

export function isEmpty(value) {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
		return true
	}
	else if (isArray(value)) {
		return value.length === 0
	}
	else if (isObject(value)) {
		return Object.keys(value).length === 0
	}
	return false
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

export function isInstanceOf(ins, cons, strict) {
  return strict ? ins.constructor === cons : ins instanceof cons
}

export function stringify(obj) {
  return JSON.stringify(obj)
}

export function map(obj, fn) {
  if (!isObject(obj) || !isArray(obj)) {
    return obj
  }

  if (!isFunction(fn)) {
    return obj
  }

  let result = isArray(obj) ? [] : {}
  let keys = Object.keys(obj)
  keys.forEach((key) => {
    let value = obj[key]
    result[key] = isFunction(fn) ? fn(value, key) || value : value
  })
  return result
}

export function decorate(factory, method) {
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

export function clone(obj, fn) {
  let parents = []
  let clone = function(origin, path = '', obj) {
    if (!isObject(origin) && !isArray(origin)) {
      return origin
    }

    let result = isArray(origin) ? [] : {}
    let keys = Object.keys(origin)

    parents.push({ obj, path, origin, result })

    for (let i = 0, len = keys.length; i < len; i ++) {
      let key = keys[i]
      let value = origin[key]
      let referer = parents.find(item => item.origin === value)
      let computed = isFunction(fn) ? fn(value, key, origin, path, obj, referer) : value

      if (!isObject(computed) && !isArray(computed)) {
        result[key] = computed
      }
      else {
        if (referer) {
          result[key] = referer.result
        }
        else {
          result[key] = clone(computed, path ? path + '.' + key : key)
        }
      }
    }

    return result
  }

  let result = clone(obj, '', obj)
  parents = null
  return result
}

export function defineProperty(obj, prop, value, writable, enumerable) {
  return Object.defineProperty(obj, prop, { value, writable, enumerable })
}

function makeKeyChain(path) {
  let chain = path.toString().split(/\.|\[|\]/).filter(item => !!item)
  return chain
}

/**
 * 根据keyPath读取对象属性值
 * @param {*} obj
 * @param {*} path
 * @example
 * parse({ child: [ { body: { head: true } } ] }, 'child[0].body.head') => true
 */
export function parse(obj, path) {
  let chain = makeKeyChain(path)

  if (!chain.length) {
    return obj
  }

  let target = obj
  for (let i = 0, len = chain.length; i < len; i ++) {
    let key = chain[i]
    if (target[key] === undefined) {
      return undefined
    }
    target = target[key]
  }
  return target
}

/**
 * 根据keyPath设置对象的属性值
 * @param {*} obj
 * @param {*} path
 * @param {*} value
 * @example
 * assign({}, 'body.head', true) => { body: { head: true } }
 */
export function assign(obj, path, value) {
  let chain = makeKeyChain(path)

  if (!chain.length) {
    return obj
  }

  let key = chain.pop()

  if (!chain.length) {
    obj[key] = value
    return obj
  }

  let target = obj

  for (let i = 0, len = chain.length; i < len; i ++) {
    let key = chain[i]
    let next = chain[i + 1] || key
    if (/^[0-9]+$/.test(next) && !isArray(target[key])) {
      target[key] = []
    }
    else if (typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }

  target[key] = value

  return obj
}

export function sortBy(items, keyPath) {
  let res = [].concat(items)
  res.sort((a, b) => {
    let oa = parse(a, keyPath)
    let ob = parse(b, keyPath)

    oa = typeof oa === 'number' && !isNaN(oa) ? oa : 10
    ob = typeof ob === 'number' && !isNaN(ob) ? ob : 10

    if (oa < ob) {
      return -1
    }
    if (oa === ob) {
      return 0
    }
    if (oa > ob) {
      return 1
    }
  })
  return res
}
