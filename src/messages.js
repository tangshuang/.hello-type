import { inObject } from './utils'

export const messages = {
  'dict.arguments.length': '{args} length does not match {name}, length should be {length}.',
  'dict.object': '{arg} which should be an object does not match {name}.',
  'enum': '{args} does not match {name}({rules}).',
  'hello.define.target.object': '{target} should be an object as target',
  'hello.define.rule.object': '{rule} should be an object as rule',
  'hello.define.property.object': '{prop} property should be an object, but receive {value}.',
  'list.arguments.length': '{args} length does not match {name}, length should be {length}.',
  'list.array': '{arg} which should be an array does not match {name}.',
  'range.arguments.length': '{args} length does not match {name}, length should be {length}.',
  'range.number': '{arg} is not a number for {name}.',
  'range': '{arg} does not match {name}({min}, {max}).',
  'rule.equal': '{arg} does not equal {rule}.',
  'rule.instanceof': '{arg} is not an instance of {rule}.',
  'rule.lambda.function': '{arg} should be a function.',
  'tuple.arguments.length': '{args} length does not match {name}, length should be {length}.',
  'tuple.strict.arguments.length': '{args} length does not match {name}  in strict mode, length should be {length}.',
  'type.arguments.length': '{args} length not match type, length should be {length}.',
  'type.Array': '{arg} does not match Array.',
  'type.Boolean': '{arg} does not match Boolean.',
  'type.function': '{arg} does not match custom rule function.',
  'type.Function': '{arg} does not match Function.',
  'type.NaN': '{arg} does not match NaN.',
  'type.Number': '{arg} does not match Number.',
  'type.Object': '{arg} does not match Object.',
  'type.object.key': '"{ruleKey}" is not in object, needs {ruleKeys}',
  'type.regexp.string': '{arg} is not a string which does not match RegExp instance.',
  'type.regexp': '{arg} does not match RegExp instance.',
  'type.String': '{arg} does not match String.',
  'type.Symbol': '{arg} does not match Symbol.',
  'type.strict.array.length': 'array length should be {ruleLen} in strict mode, but receive {argLen}.',
  'type.strict.object.key': '"{argKey}" should not be in object, only "{ruleKeys}" allowed in strict mode.',
  'type': '{arg} does not match type.',
}
export function criticize(key, params) {
  let message = messages[key]
  if (!message) {
    message = '{arg} not match type.'
  }
  return message.replace(/\{(.*?)\}/g, (match, key) => inObject(key, params) ? params[key] : '%$1')
}

export default messages
