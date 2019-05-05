import { isInstanceOf, isFunction } from './utils.js'
import Type from './type.js'

export class TySheMo {
  constructor() {
    this._listeners = []
    this._silent = false
  }

  bind(fn) {
    if (isFunction(fn)) {
      this._listeners.push(fn)
    }
    return this
  }
  unbind(fn) {
    this._listeners.forEach((item, i) => {
      if (item === fn) {
        this._listeners.splice(i, 1)
      }
    })
    return this
  }
  dispatch(error) {
    this._listeners.forEach((fn) => {
      Promise.resolve().then(() => fn.call(this, error))
    })
    return this
  }

  silent(value) {
    this._silent = !!value
  }
  throw(error) {
    this.dispatch(error)

    if (!this._silent) {
      throw error
    }
  }

  /**
   * @example
   * ts.expect(10).to.match(Number)
   */
  expect(value) {
    return {
      to: {
        match: (type) => {
          if (!isInstanceOf(type, Type)) {
            type = new Type(type)
          }

          try {
            type.assert(value)
            return true
          }
          catch (e) {
            this.throw(e)
            return false
          }
        },
        be: (type) => {
          return this.expect(value).to.match(type)
        },
      },
    }
  }

  /**
   * @example
   * let error = ts.catch(10).by(Number)
   */
  catch(value) {
    return {
      by: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        let error = type.catch(value)
        if (error) {
          this.dispatch(error)
        }
        return error
      },
    }
  }

  /**
   * @example
   * ts.trace('10').by(Number)
   */
  trace(value) {
    return {
      by: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        return type.trace(value).catch(error => this.throw(error))
      },
    }
  }

  /**
   * @example
   * ts.track('10').by(Number)
   */
  track(value) {
    return {
      by: (type) => {
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        return type.track(value).catch(error => this.throw(error))
      },
    }
  }

  /**
   * determine whether type match
   * @example
   * let bool = ts.is(Number).typeof(10)
   * let bool = ts.is(10).of(Number)
   */
  is(arg) {
    return {
      typeof: (value) => {
        let type = arg
        if (!isInstanceOf(type, Type)) {
          type = new Type(type)
        }

        let error = type.catch(value)
        if (error) {
          this.dispatch(error)
        }
        return !error
      },
      of: (type) => this.is(type).typeof(arg),
    }
  }

  /**
   * @param {string|undefined} which input|output
   * @example
   * @ts.decorate('input').with((value) => SomeType.assert(value))
   */
  decorate(method) {
    var $this = this
    var decorator = {
      by: instance => {
        $this = instance
        return decorator
      },
      with: (type) => function(target, prop, descriptor) {
        // decorate class constructor function
        if (target && !prop) {
          if (method !== 'input' && method !== 'output') {
            return class extends target {
              constructor(...args) {
                $this.expect(args).to.be(type)
                super(...args)
              }
            }
          }
          else {
            return target
          }
        }
        // decorate class member
        else if (prop) {
          // change the property
          if (method !== 'input' && method !== 'output') {
            descriptor.set = (value) => {
              $this.expect(value).to.be(type)
              descriptor.value = value
            }
          }

          // method
          if (typeof property === 'function' && (method === 'input' || method === 'output')) {
            let property = descriptor.value
            let wrapper = function(...args) {
              if (method === 'input') {
                $this.expect(args).to.be(type)
              }
              let result = property.call(this, ...args)
              if (method === 'output') {
                $this.expect(result).to.be(type)
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
    return decorator
  }

}

export const ts = new TySheMo()
TySheMo.expect = ts.expect.bind(ts)
TySheMo.catch = ts.catch.bind(ts)
TySheMo.trace = ts.trace.bind(ts)
TySheMo.track = ts.track.bind(ts)
TySheMo.is = ts.is.bind(ts)
TySheMo.decorate = ts.decorate.bind(ts)

export default TySheMo
