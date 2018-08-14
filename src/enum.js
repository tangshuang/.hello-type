import Type from './type'
import { inArray, throwError } from './utils'

export default function Enum(...patterns) {
  let EnumType = new Type(...patterns)
  EnumType.assert = function(arg) {
    if (!inArray(arg, this.patterns)) {
      return throwError(`"${arg}" is not match Enum(${this.patterns.join(',')}) type`)
    }
    return true
  }
  return EnumType
}