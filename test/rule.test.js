import Type from '../src/type.js'
import Rule, { Any, Null, Undefined, Numeric, Int, Float } from '../src/rule.js'
import Tuple from '../src/tuple.js'

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
  test('Null', () => {
    const NullType = new Type(Null)
    expect(() => { NullType.assert({}) }).toThrowError()
    expect(() => { NullType.assert(null) }).not.toThrowError()
  })
  test('Undefined', () => {
    const UndefinedType = new Type(Undefined)
    expect(() => { UndefinedType.assert({}) }).toThrowError()
    expect(() => { UndefinedType.assert(undefined) }).not.toThrowError()
  })
  test('Any', () => {
    const AnyType = new Type(Any)
    expect(() => { AnyType.assert({}) }).not.toThrowError()
    expect(() => { AnyType.assert('') }).not.toThrowError()
    expect(() => { AnyType.assert(1) }).not.toThrowError()
  })
  test('Numeric', () => {
    const SomeType = new Type({
      number: Numeric,
      numeral: Numeric,
    })
    const some = {
      number: 1234,
      numeral: '-23132.23423'
    }
    expect(() => SomeType.assert(some)).not.toThrowError()
  })
  test('Int', () => {
    const SomeType = new Type(Int)
    expect(SomeType.test(12)).toBeTruthy()
    expect(SomeType.test(12.3)).toBeFalsy()
  })
  test('Float', () => {
    const SomeType = new Type(Float)
    expect(SomeType.test(12.4)).toBeTruthy()
    expect(SomeType.test(12)).toBeFalsy()
  })
})
