import HelloType from '../src/hello-type'
import Type from '../src/type'
import { IfExists } from '../src/rule'
import Tuple from '../src/tuple'
import List from '../src/list'

describe('strict mode', () => {
  test('new Type', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => SomeType.strict.assert({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => SomeType.Strict.assert({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => SomeType.strict.assert({ name: 'tomy', age: 10, height: 170 })).toThrowError()
    expect(() => SomeType.strict.assert({ name: 'tomy' })).toThrowError()
  })
  test('List', () => {
    const SomeType = List([String, Number])
    expect(() => SomeType.Strict.assert(['tomy', 10])).not.toThrowError()
    expect(() => SomeType.Strict.assert(['tomy'])).toThrowError()
    expect(() => SomeType.Strict.assert(['tomy', 10, 'tomy'])).toThrowError()
  })
  test('List IfExists', () => {
    const SomeType = List([String, IfExists(Number)])
    expect(() => SomeType.Strict.assert(['tomy', 10])).not.toThrowError()
    expect(() => SomeType.Strict.assert(['tomy'])).toThrowError()
    expect(() => SomeType.Strict.assert(['tomy', 10, 'tomy'])).toThrowError()
  })
  test('Tuple', () => {
    const SomeType = Tuple(String, Number, IfExists(Object))
    expect(() => SomeType.assert('tomy', 10)).not.toThrowError()
    expect(() => SomeType.Strict.assert('tomy', 10)).toThrowError()
  })
  test('HelloType', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => HelloType.expect(SomeType.Strict).toBe.typeof({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => HelloType.expect(SomeType.Strict).toBe.typeof({ name: 'tomy', age: 10, height: 170 })).toThrowError()
    expect(() => HelloType.expect(SomeType.Strict).toBe.typeof({ name: 'tomy' })).toThrowError()
  })
  test('toBeStrict', () => {
    const SomeType = new Type(Number)
    expect(SomeType).toEqual(SomeType.toBeStrict())
    expect(SomeType).not.toEqual(SomeType.Strict)
  })
})