import Type from './type'
import { inArray, throwError } from './utils'

export default function Enum(...patterns) {
  let EnumType = new Type(...patterns)
  EnumType.assert = function(arg) {
    if (!inArray(arg, this.patterns)) {
      throwError(`"${arg}" is not match Enum(${this.patterns.join(',')}) type`)
    }
  }
  return EnumType
}