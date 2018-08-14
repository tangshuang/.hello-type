import Type from './type'
import { isObject, isEmpty } from './utils'

export default function Dict(pattern) {
  // if pattern is not an object, it treated undefined
  if (!isObject(pattern)) {
    return new Type(Object)
  }

  // if pattern is an empty object, it treated to be an Object
  if (isEmpty(pattern)) {
    return new Type(Object)
  }

  let DictType = new Type(pattern)
  DictType.assert = function(args) {
    if (!isObject(args)) {
      throw new Error(`"${typeof(args)}" is not match Dict type`)
    }

    let rules = this.rules[0]
    let ruleKeys = Object.keys(rules).sort()
    let argKeys = Object.keys(args).sort()
    
    if (this.mode === 'strict') {
      // properties should be absolutely same
      for (let i = 0, len = argKeys.length; i < len; i ++) {
        let argKey = argKeys[i]
        
        // args has key beyond rules
        if (ruleKeys.indexOf(argKey) === -1) {
          throw new Error(`"${argKey}" should not be in Dict, only ${ruleKeys.join(',')} allowed in strict mode`)
        }
      }
    }

    for (let i = 0, len = ruleKeys.length; i < len; i ++) {
      let ruleKey = ruleKeys[i]

      // not found some key in arg
      if (argKeys.indexOf(ruleKey) === -1) {
        throw new Error(`"${ruleKey}" is not in Dict, needs ${ruleKeys.join(',')}`)
      }

      let argKey = ruleKey
      let rule = rules[ruleKey]
      let value = args[argKey]

      let result = this.vaildate(value, rule)
      if (result !== true) {
        return result
      }
    }

    return true
  }
  return DictType
}