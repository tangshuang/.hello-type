import HelloType from '../src/ts'
import Type from '../src/type'
import { IfExists } from '../src/rule'
import Tuple from '../src/tuple'
import List from '../src/list'

xdescribe('strict mode', () => {
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
    expect(() => HelloType.expect({ name: 'tomy', age: 10 }).to.match(SomeType.Strict)).not.toThrowError()
    expect(() => HelloType.expect({ name: 'tomy', age: 10, height: 170 }).to.match(SomeType.Strict)).toThrowError()
    expect(() => HelloType.expect({ name: 'tomy' }).to.match(SomeType.Strict)).toThrowError()
  })
  test('toBeStrict', () => {
    const SomeType = new Type(Number)
    expect(SomeType).toBe(SomeType.toBeStrict())
    expect(SomeType).not.toBe(SomeType.Strict)
  })
})
