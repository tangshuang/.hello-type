import Type from './type'
import { isArray } from './utils'

export default function List(pattern) {
  let ListType = new Type(pattern)
  ListType.assert = function(arr) {
    if (!isArray(arr)) {
      throw new Error(`${arr} is not match List type`)
    }
    let pattern = this.patterns[0]
    arr.forEach((item) => {
      this.vaildate(item, pattern)
    })
  }
  return ListType
}