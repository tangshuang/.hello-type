import Type from '../src/type'
import Rule, { Any, IfExists } from '../src/rule'
import Tuple from '../src/tuple'

describe('Rule', () => {
  test('create a rule match object', () => {
    const ObjectRule = new Rule(function(value) {
      if (typeof value !== 'object') {
        return new Error(value + ' is not an object')
      }
    })
    const ObjectType = new Type(ObjectRule)
    expect(() => { ObjectType.assert({}) }).not.toThrowError()
    expect(() => { ObjectType.assert(null) }).not.toThrowError()
    expect(() => { ObjectType.assert([]) }).not.toThrowError()
    expect(() => { ObjectType.assert('') }).toThrowError()
  })
  test('Any', () => {
    const AnyType = new Type(Any)
    expect(() => { AnyType.assert({}) }).not.toThrowError()
    expect(() => { AnyType.assert('') }).not.toThrowError()
    expect(() => { AnyType.assert(1) }).not.toThrowError()
  })
  test('IfExists for object', () => {
    const IfExistsType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => { IfExistsType.assert({ name: 'tomy' }) }).not.toThrowError()
  })
  test('IfExists for array', () => {
    const IfExistsType = new Type({
      name: String,
      children: [IfExists(Object)], // children should be an array, but array length can be 0
    })
    expect(() => { IfExistsType.assert({ name: 'tomy', children: [] }) }).not.toThrowError()
    expect(() => { IfExistsType.assert({ name: 'tomy', children: null }) }).toThrowError()
    expect(() => { IfExistsType.assert({ name: 'tomy', children: [{}] }) }).not.toThrowError()
  })
  test('IfExists for tuples', () => {
    const IfExistsType = Tuple(String, IfExists(Number))
    expect(() => { IfExistsType.assert('name') }).not.toThrowError()
    expect(() => { IfExistsType.assert('name', 10) }).not.toThrowError()
    expect(() => { IfExistsType.assert('name', '10') }).toThrowError()
  })
})
