import Type from './type'

export default function Tuple(...patterns) {
  let TupleType = new Type(...patterns)
  return TupleType
}