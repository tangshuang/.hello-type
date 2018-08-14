import Type from './type'
import { isArray, throwError } from './utils'

export default function List(pattern) {
  let ListType = new Type(pattern)
  ListType.assert = function(arr) {
    if (!isArray(arr)) {
      return throwError(`"${arr}" is not match List type`)
    }
    
    let pattern = this.patterns[0]
    for (let i = 0, len = arr.length; i < len; i ++) {
      let item = arr[i]
      let result = this.vaildate(item, pattern)
      if (result !== true) {
        return result
      }
    }

    return true
  }
  return ListType
}