import Type from '../src/type'
import Rule, { Any, Null, Undefined, IfExists, InstanceOf, Equal, IfNotMatch, Validate, IfExistsNotMatch, Determine, Async } from '../src/rule'
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
    expect(() => { IfExistsType.assert({ name: 'tomy', children: [0] }) }).toThrowError()
  })
  test('IfExists for tuples', () => {
    const IfExistsType = Tuple(String, IfExists(Number))
    expect(() => { IfExistsType.assert('name') }).not.toThrowError()
    expect(() => { IfExistsType.assert('name', 10) }).not.toThrowError()
    expect(() => { IfExistsType.assert('name', '10') }).toThrowError()
  })
  test('InstanceOf', () => {
    const InstanceOfType = new Type({
      num: InstanceOf(Number),
      str: InstanceOf(String),
    })
    expect(() => {
      InstanceOfType.assert({
        num: new Number(4),
        str: new String('this is ok'),
      })
    }).not.toThrowError()
  })
  test('Equal', () => {
    const name = new String('tomy')
    const EqualType = new Type({
      name: Equal(name)
    })
    expect(() => {
      EqualType.assert({
        name: name,
      })
    }).not.toThrowError()
  })
  test('IfNotMatch', () => {
    const SomeType = new Type({
      name: String,
      age: IfNotMatch(Number, 0),
    })

    // exists, but not match
    const obj = {
      name: 'tomy',
      age: null,
    }
    expect(() => { SomeType.assert(obj) }).not.toThrowError()
    expect(obj.age).toEqual(0)

    // not exists
    const obj2 = {
      name: 'tomy',
    }
    expect(() => { SomeType.assert(obj2) }).not.toThrowError()
    expect(obj2.age).toEqual(0)
  })
  test('IfNotMatch with function', () => {
    const SomeType = new Type({
      name: String,
      age: IfNotMatch(Number, null, value => typeof value === 'number' ? (value || 0) : (+value || 0)),
    })

    // exists, but not match
    const obj = {
      name: 'tomy',
      age: '10',
    }
    expect(() => { SomeType.assert(obj) }).not.toThrowError()
    expect(obj.age).toEqual(10)

    // not exists
    const obj2 = {
      name: 'tomy',
    }
    expect(() => { SomeType.assert(obj2) }).not.toThrowError()
    expect(obj2.age).toEqual(0)
  })
  test('Validate', () => {
    const SomeType = new Type(Validate(Number, 'It should be a number.'))
    let error = SomeType.catch('string')
    let message = error.message
    expect(message).toEqual('It should be a number.')
  })
  test('IfExistsNotMatch', () => {
    const SomeType = new Type({
      name: String,
      age: IfExistsNotMatch(Number, 0),
    })

    // if not exists `age`
    const some1 = {
      name: 'tomy',
    }
    expect(SomeType.catch(some1)).toBeNull()
    expect(some1.age).toBeUndefined()

    // if exists age, but not match
    const some2 = {
      name: 'tomy',
      age: null,
    }
    expect(SomeType.catch(some2)).toBeNull()
    expect(some2.age).toBe(0)
  })
  test('nested rules', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Equal(10)),
    })
    expect(SomeType.catch({ name: 'tomy' })).toBeNull()
    expect(() => SomeType.assert({ name: 'tomy', age: 2 })).toThrowError()
  })
  test('Determine', () => {
    const SomeType = new Type({
      is: Boolean,
      has: Determine(function(obj) {
        return obj.is ? String : Null
      }),
    })
    expect(SomeType.catch({ is: true, has: 'one' })).toBeNull()
    expect(() => SomeType.assert({ is: false, has: 'one' })).toThrowError()
    expect(SomeType.catch({ is: false, has: null })).toBeNull()
  })
  test('Async', (done) => {
    const AsyncRule = Async(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(String)
        })
      })
    })
    const SomeType = new Type({ text: AsyncRule })
    expect(SomeType.catch({ text: null })).toBeNull()
    AsyncRule.__async__.then(() => {
      expect(() => SomeType.assert({ text: null })).toThrowError()
      done()
    })
  })
})
