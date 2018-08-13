import Type from './type'
import { isArray, throwError } from './utils'

export default function List(pattern) {
  let ListType = new Type(pattern)
  ListType.assert = function(arr) {
    if (!isArray(arr)) {
      return throwError(`"${arr}" is not match List type`)
    }
    let pattern = this.patterns[0]
    arr.forEach((item) => {
      this.vaildate(item, pattern)
    })
  }
  return ListType
}