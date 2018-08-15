import Type from '../src/type'
import Rule, { Any, Self, IfExists } from '../src/rule'

describe('Rule', () => {
  test('create a rule match object', () => {
    const ObjectRule = new Rule(function(value) {
      return typeof value === 'object'
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
  test('IfExists', () => {
    const IfExistsType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => { IfExistsType.assert({ name: 'tomy' }) }).not.toThrowError()
  })
  test('Self', () => {
    const PersonType = new Type({
      name: String,
      child: IfExists(Self),
    })
    expect(() => { 
      PersonType.assert({
        name: 'john',
        child: {
          name: 'tomy',
        },
      }) 
    }).not.toThrowError()
  })
})
