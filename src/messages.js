import { inObject } from './utils'

export const messages = {
  'type.function': '{arg} does not match custom rule function.',
  'type.NaN': '{arg} does not match NaN.',
  'type.Number': '{arg} does not match Number.',
  'type.Boolean': '{arg} does not match Boolean.',
  'type.String': '{arg} does not match String.',
  'type.regexp.string': '{arg} is not a string which does not match RegExp instance.',
  'type.regexp': '{arg} does not match RegExp instance.',
  'type.Function': '{arg} does not match Function.',
  'type.Array': '{arg} does not match Array.',
  'type.Object': '{arg} does not match Object.',
  'type.Symbol': '{arg} does not match Symbol.',
  'type.array.strict.length': 'array length should be {ruleLen} in strict mode, but receive {argLen}.',
  'type.object.strict.key': '"{argKey}" should not be in object, only "{ruleKeys}" allowed in strict mode.',
  'type': '{arg} does not match type.',
  'type.arguments.length': 'arguments length not match type.',
  'dict.arguments.length': 'arguments length not match {name}.',
  'dict.object': '{arg} which should be an object does not match {name}.',
  'enum': '{args} does not match {name}({patterns}).',
  'list.arguments.length': 'arguments length not match {name}.',
  'list.array': '{arg} which should be an array does not match {name}.',
  'range.arguments.length': 'arguments length not match {name}.',
  'range.number': '{arg} is not a number for {name}.',
  'range': '{arg} does not match {name}({min}, {max}).',
  'rule.instanceof': '{arg} is not an instance of {rule}.',
  'rule.equal': '{arg} does not equal {rule}.',
  'rule.lambda.function': '{arg} should be a function.',
  'tuple.arguments.strict.length': 'arguments length not match {name} in strict mode.',
  'tuple.arguments.length': 'arguments length not match {name}.',
}
export function notify(key, params) {
  let message = messages[key]
  if (!message) {
    message = '{arg} not match type.'
  }
  return message.replace(/\{(.*?)\}/g, (match, key) => inObject(key, params) ? params[key] : '%$1')
}

export default message
