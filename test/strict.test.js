import HelloType from '../src/hello-type'
import Type from '../src/type'
import { IfExists } from '../src/rule'

describe('strict mode', () => {
  test('new Type', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => SomeType.strict.assert({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => SomeType.Strict.assert({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => SomeType.strict.assert({ name: 'tomy', age: 10, height: 170 })).toThrowError()
    expect(() => SomeType.strict.assert({ name: 'tomy' })).not.toThrowError()
  })
  test('HelloType', () => {
    const SomeType = new Type({
      name: String,
      age: IfExists(Number),
    })
    expect(() => HelloType.expect(SomeType.strict).toBe.typeof({ name: 'tomy', age: 10 })).not.toThrowError()
    expect(() => HelloType.expect(SomeType.strict).toBe.typeof({ name: 'tomy', age: 10, height: 170 })).toThrowError()
    expect(() => HelloType.expect(SomeType.strict).toBe.typeof({ name: 'tomy' })).not.toThrowError()
  })
})